import {CrudService, getStringIds, ServiceOptions} from '@lenne.tech/nest-server';
import {forwardRef, Inject, Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {execa} from 'execa';
import {PubSub} from 'graphql-subscriptions';
import {Model, Types} from 'mongoose';
import {Container} from '../container/container.model';
import {ContainerService} from '../container/container.service';
import {Build, BuildDocument} from './build.model';
import {BuildStatus} from './enums/build-status.enum';
import {ContainerStatus} from "../container/enums/container-status.enum";
import {WebPushService} from "../web-push/web-push.service";
import {ProjectService} from "../project/project.service";
import {DockerService} from "../../common/services/docker.service";
import {FileService} from "../../common/services/file.service";
import {BuildCreateInput} from "./inputs/build-create.input";
import {InjectQueue} from "@nestjs/bull";
import {Queue} from "bull";
import axios from 'axios';
import {AdditionalBuildInfos} from "../../common/interfaces/additional-build-infos.interface";
import {DeploymentType} from "../container/enums/deployment-type.enum";
import * as console from "node:console";
import {promises as fs} from "fs";
import envConfig from "../../../config.env";

/**
 * Build service
 */
@Injectable()
export class BuildService extends CrudService<Build> {
  // ===================================================================================================================
  // Properties
  // ===================================================================================================================

  // ===================================================================================================================
  // Injections
  // ===================================================================================================================

  /**
   * Constructor for injecting services
   */
  constructor(
    @InjectModel('Build') protected readonly buildModel: Model<BuildDocument>,
    @Inject('PUB_SUB') protected readonly pubSub: PubSub,
    @Inject(forwardRef(() => DockerService))
    private dockerService: DockerService,
    @Inject(forwardRef(() => ContainerService))
    private containerService: ContainerService,
    @Inject(forwardRef(() => ProjectService))
    private projectService: ProjectService,
    @Inject(forwardRef(() => WebPushService))
    private webPushService: WebPushService,
    private fileService: FileService,
    @InjectQueue('build') private buildQueue: Queue
  ) {
    super({mainDbModel: buildModel, mainModelConstructor: Build});
  }

  // ===================================================================================================================
  // Methods
  // ===================================================================================================================
  async findForContainer(containerId: string, serviceOptions?: ServiceOptions) {
    return this.find({
      filterQuery: {container: new Types.ObjectId(containerId)},
      queryOptions: {sort: [{createdAt: -1}]}
    }, serviceOptions);
  }

  pauseQueue() {
    return this.buildQueue.pause();
  }

  resumeQueue() {
    return this.buildQueue.resume();
  }

  override async create(input: BuildCreateInput, additionalInfos?: AdditionalBuildInfos, serviceOptions?: ServiceOptions): Promise<Build> {
    const lastBuild = await this.getLastBuild(getStringIds(input.container));

    if (lastBuild && lastBuild?.status === BuildStatus.QUEUE) {
      await this.removeBuildFromQueue(lastBuild);
      await this.update(lastBuild.id, {status: BuildStatus.SKIPPED});
      await this.updateBuildLog(lastBuild.id, ' Skipped build because of newer build!', 'info');
    }

    const createdBuild = await super.create(input, serviceOptions);
    await this.containerService.update(getStringIds(createdBuild.container), {lastBuild: createdBuild.id})

    if (additionalInfos?.callbackUrl) {
      try {
        await axios.post(additionalInfos.callbackUrl, {
          status: BuildStatus.QUEUE,
          duration: 0,
          ...additionalInfos
        });
      } catch (e) {
        console.debug(`Callback for ${createdBuild.id} failed with error ${e}`);
      }
    }

    await this.buildQueue.add({
      containerId: getStringIds(input.container),
      buildId: createdBuild.id,
      additionalInfos
    }, {jobId: createdBuild.id});

    return createdBuild;
  }

  async removeBuildFromQueue(build: Build) {
    if (build.status === BuildStatus.QUEUE) {
      const job = await this.buildQueue.getJob(build.id);

      if (job) {
        await job.remove();
      }
    }
  }

  async getLastBuild(containerId: string): Promise<Build | null> {
    const builds = await this.findForContainer(containerId);

    if (!builds.length) {
      return null;
    }

    return builds[0];
  }

  async setBuildStatus(id: string, status: BuildStatus, additionalInfos?: AdditionalBuildInfos) {
    const build = await this.getForce(id);
    let finishedAt = null;

    if (status === BuildStatus.RUNNING || status === BuildStatus.QUEUE) {
      await this.containerService.setStatus(getStringIds(build.container), ContainerStatus.BUILDING);
    }

    if (status !== BuildStatus.RUNNING) {
      finishedAt = new Date();
    }

    // Send callback
    if (additionalInfos?.callbackUrl) {
      try {
        await axios.post(additionalInfos.callbackUrl, {
          status: status,
          ...additionalInfos
        });
      } catch (e) {
        console.debug(`Callback for ${id} failed with error ${e}`);
      }
    }

    return this.buildModel.updateOne({_id: id}, {status, finishedAt}).exec();
  }

  async updateBuildLog(id: string, log: string, type: 'log' | 'error' | 'success' | 'info' = 'log') {
    const build = await this.get(id);

    if (!build) {
      throw new Error('Build not found');
    }

    switch (type) {
      case 'error':
        log = `[ERROR] - ${log}`;
        break;
      case 'success':
        log = `[SUCCESS] - ${log}`;
        break;
      case 'info':
        log = `[INFO] - ${log}`;
        break;
      case "log":
        log = `[LOG] - ${log}`;
        break;
      default:
        log = `[LOG] - ${log}`;
        break;
    }

    await this.buildModel.updateOne({_id: id}, {$push: {log: {$each: [log], $slice: -5000}}}).exec();
  }

  async stop(id: string, serviceOptions?: ServiceOptions) {
    const build = await this.get(id, serviceOptions);

    await this.removeBuildFromQueue(build);
    await this.update(build.id, {status: BuildStatus.CANCEL})
    await this.updateBuildLog(id, ' ---------------------------------------------------', 'info');
    await this.updateBuildLog(id, ' 📣 Stopped build with id ' + id, 'info');
    await this.updateBuildLog(id, ' ---------------------------------------------------', 'info');

    return true;
  }

  async restart(id: string, serviceOptions?: ServiceOptions) {
    const build = await this.get(id, serviceOptions);
    const container = await this.containerService.get(getStringIds(build.container), serviceOptions);
    const project = await this.projectService.getProjectByContainer(container);
    const capitalizedProjectName = project.name.charAt(0).toUpperCase() + project.name.slice(1)
    await this.updateBuildLog(build.id, ' ---------------------------------------------------', 'info');
    await this.updateBuildLog(build.id, ' 📣 Restart build with id ' + build.id, 'info');
    await this.updateBuildLog(build.id, ' ---------------------------------------------------', 'info');
    await this.webPushService.notifyProjectSubs(project.id, {
      title: '🔄 Restart build!',
      body: `${capitalizedProjectName} - ${container.name} restarted build.`,
      image: 'https://lennetech.app/notification.png'
    });

    await this.update(build.id, {status: BuildStatus.QUEUE, restarted: true});
    await this.buildQueue.add({containerId: getStringIds(build.container), buildId: build.id}, {jobId: build.id});

    return true;
  }

  checkBuildIsCancel(build: Build) {
    if (build.status === BuildStatus.CANCEL) {
      throw new Error('Build was canceled');
    }
  }

  async triggerBuild(containerId: string, buildId: string, additionalInfos?: AdditionalBuildInfos): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      const container = await this.containerService.getForce(containerId, {populate: 'registry'});
      const project = await this.projectService.getProjectByContainer(container);
      const build = await this.get(buildId, {populate: 'container'});
      const capitalizedProjectName = project.name.charAt(0).toUpperCase() + project.name.slice(1)

      await this.checkBuildIsCancel(build);
      await this.setBuildStatus(build.id, BuildStatus.RUNNING, additionalInfos);

      if (container.env) {
        await this.dockerService.createEnvFile(container);
      }

      await this.checkBuildIsCancel(build);

      this.updateBuildLog(build.id, 'Start building docker image 🏗️', 'info');
      this.dockerService
        .buildImage(container, build.id)
        .then(async () => {
          await this.checkBuildIsCancel(build);

          await this.updateBuildLog(build.id, 'Pushing image to registry 🚀', 'info');
          this.dockerService
            .pushImage(container, build.id)
            .then(async () => {
              await this.checkBuildIsCancel(build);

              await this.updateBuildLog(build.id, 'Deploying container 🚢', 'info');
              this.dockerService
                .deploy(container)
                .then(async () => {
                  await this.checkBuildIsCancel(build);

                  await this.updateBuildLog(build.id, 'Deployed 🎉', 'success');
                  await this.setBuildStatus(build.id, BuildStatus.SUCCESS, additionalInfos);

                  // update containers version if deployment type tag
                  if (additionalInfos?.deploymentType === DeploymentType.TAG) {
                    await this.updateBuildLog(build.id, 'Remove old tag version from system', 'info');
                    try {
                      await fs.rm(`${envConfig.projectsDir}/${container.id}/${additionalInfos?.currentVersion}`, { recursive: true, force: true });
                    } catch (e) {
                      console.debug(`Error while removing old version: ${e}`);
                    }
                  }

                  const projectIsRunning = await this.checkProjectIsBuilding(build);
                  if (!projectIsRunning) {
                    await this.webPushService.notifyProjectSubs(project.id, {
                      title: 'Deployed 🎉',
                      body: `${capitalizedProjectName} deployed successfully.`,
                      image: 'https://lennetech.app/notification.png'
                    });
                  }
                  resolve(true);
                })
                .catch(async (e: Error) => {
                  console.error(e);
                  await this.updateBuildLog(build.id, e.message, 'error');
                  await this.updateBuildLog(build.id, e.stack, 'error');
                  await this.updateBuildLog(build.id, ' ❌ Failed on start!', 'error');
                  await this.setBuildStatus(build.id, BuildStatus.FAILED, additionalInfos);
                  await this.checkALlBuildsOfContainerFailed(container);
                  await this.webPushService.notifyProjectSubs(project.id, {
                    title: '❌ Failed on start!',
                    body: `${capitalizedProjectName} - ${container.name} failed on start. Please take a look.`,
                    image: 'https://lennetech.app/notification.png'
                  });
                  resolve(false);
                });
            })
            .catch(async (e) => {
              console.error(e);
              await this.updateBuildLog(build.id, e.message, 'error');
              await this.updateBuildLog(build.id, e.stack, 'error');
              await this.updateBuildLog(build.id, ' ❌ Failed on push!', 'error');
              await this.setBuildStatus(build.id, BuildStatus.FAILED, additionalInfos);
              await this.checkALlBuildsOfContainerFailed(container);
              await this.webPushService.notifyProjectSubs(project.id, {
                title: '❌ Failed on push!',
                body: `${capitalizedProjectName} - ${container.name} failed on push. Please take a look.`,
                image: 'https://lennetech.app/notification.png'
              });
              resolve(false);
            });
        })
        .catch(async (e: Error) => {
          console.error(e);
          await this.updateBuildLog(build.id, e.message, 'error');
          await this.updateBuildLog(build.id, e.stack, 'error');
          await this.updateBuildLog(build.id, ' ❌ Failed on build!', 'error');
          await this.setBuildStatus(build.id, BuildStatus.FAILED, additionalInfos);
          await this.checkALlBuildsOfContainerFailed(container);
          await this.webPushService.notifyProjectSubs(project.id, {
            title: '❌ Failed on build!',
            body: `${capitalizedProjectName} - ${container.name} failed on build. Please take a look.`,
            image: 'https://lennetech.app/notification.png'
          });
          resolve(false);
        });
    });
  }

  async checkALlBuildsOfContainerFailed(container: Container) {
    const buildsOfContainer = await this.findForce({filterQuery: {container: getStringIds(container)}});
    const allBuildsFailed = buildsOfContainer.every((e) => e.status === BuildStatus.FAILED);

    if (allBuildsFailed) {
      await this.containerService.setStatus(getStringIds(container), ContainerStatus.DIED);
    }
  }

  async checkNoBuildingsOfContainer(container: Container) {
    const buildsOfContainer = await this.findForce({filterQuery: {container: getStringIds(container)}});
    const runningBuild = buildsOfContainer.find((e) => e.status === BuildStatus.RUNNING);

    if (!runningBuild) {
      await this.containerService.setStatus(getStringIds(container), ContainerStatus.DEPLOYED);
    }
  }

  async checkProjectIsBuilding(build: Build): Promise<boolean> {
    const project = await this.projectService.getProjectByContainer(build.container as Container);

    if (!project || !project.containers.length) {
      return false;
    }

    const otherContainers = (project.containers as string[]).filter((e: string) => getStringIds(e) !== getStringIds(build.container));
    if (!otherContainers.length) {
      return false;
    }

    let runningContainer = false;
    for (const containerId of otherContainers) {
      const container = await this.containerService.getForce(containerId);

      if (container.status !== ContainerStatus.BUILDING) {
        continue;
      }

      runningContainer = true;
    }

    return runningContainer;
  }

  async cloneGitLab(container: Container, build: Build, token: string) {
    await this.checkBuildIsCancel(build);
    await this.updateBuildLog(build.id, `Cloning ${container.name}:${this.containerService.getContainerSource(container)}...`, 'info');

    const url = container.repositoryUrl.replace('https://', '').replace('http://', '');
    try {
      await this.checkBuildIsCancel(build);
      await this.fileService.recreateFolder(`${this.dockerService.getPath(container)}/code`);
      await this.checkBuildIsCancel(build);
      await execa(
        `git clone -b ${this.containerService.getContainerSource(container)} https://gitlab-ci-token:${token}@${url} ${this.dockerService.getPath(container)}/code`,
        {shell: true}
      );
    } catch (e) {
      console.error(e);
      await this.updateBuildLog(build.id, JSON.stringify(e), 'error');
      await this.updateBuildLog(build.id, ` ❌ Cloning failed!`, 'error');
      await this.setBuildStatus(build.id, BuildStatus.FAILED);
    }
  }
}
