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
import {buildGitCloneArgs, buildGitCredentialEnv} from './git-clone.helper';
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
import {StackDeployVerificationError} from "../../common/helpers/stack-deploy-verification.helper";

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
              // Taken before the deploy: only a Swarm update that started after it belongs to this build.
              const deployStartedAt = new Date();
              this.dockerService
                .deploy(container)
                .then(async () => {
                  await this.checkBuildIsCancel(build);

                  // DEV-4068: `docker stack deploy` returns as soon as Swarm accepted the new specs.
                  // A version that crashes on start used to end in SUCCESS here while Swarm rolled it
                  // back or the stage went down. The build now waits for the outcome.
                  if (envConfig.dockerSwarm) {
                    await this.updateBuildLog(build.id, 'Waiting for the new version to start and become healthy 🩺', 'info');
                    const verification = await this.dockerService.verifyStackDeploy(container, deployStartedAt, (detail) =>
                      this.updateBuildLog(build.id, `Waiting: ${detail}`, 'info')
                    );
                    if (!verification.ok) {
                      await this.updateBuildLog(build.id, ' ❌ The new version did not come up:', 'error');
                      for (const line of verification.lines) {
                        await this.updateBuildLog(build.id, line, 'error');
                      }
                      throw new StackDeployVerificationError();
                    }
                    await this.updateBuildLog(build.id, `New version is up: ${verification.lines.join('; ')}`, 'info');
                  }

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
                  // A failed verification has already logged its reason and the task error; its
                  // stack trace would only bury them.
                  if (!(e instanceof StackDeployVerificationError)) {
                    await this.updateBuildLog(build.id, e.message, 'error');
                    await this.updateBuildLog(build.id, e.stack, 'error');
                  }
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

  /**
   * Clones the source into the build folder. Returns false when the clone failed; the build is then
   * FAILED with git's error in the log and must not go on (DEV-4068): building after a failed clone
   * used stale or empty code and could even end in SUCCESS.
   */
  async cloneGitLab(container: Container, build: Build, token: string, additionalInfos?: AdditionalBuildInfos): Promise<boolean> {
    await this.checkBuildIsCancel(build);
    await this.updateBuildLog(build.id, `Cloning ${container.name}:${this.containerService.getContainerSource(container)}...`, 'info');

    try {
      await this.checkBuildIsCancel(build);
      await this.fileService.recreateFolder(`${this.dockerService.getPath(container)}/code`);
      await this.checkBuildIsCancel(build);
      // DEV-4027: the token goes to git as a header via the environment. It is no longer part of
      // the URL, so it lands neither in `.git/config` (and with it in the image) nor in the build
      // log of a failed clone.
      // DEV-4081: no shell. The branch or tag can come from the webhook and goes to git as one
      // argument; a name with shell or git special characters is rejected before git runs.
      await execa(
        'git',
        buildGitCloneArgs({
          branch: this.containerService.getContainerSource(container),
          repositoryUrl: container.repositoryUrl,
          target: `${this.dockerService.getPath(container)}/code`,
        }),
        {env: buildGitCredentialEnv(token)}
      );
      return true;
    } catch (e) {
      console.error(e);
      // `message` carries git's own error output; JSON.stringify drops it for a plain Error.
      await this.updateBuildLog(build.id, e?.message ?? String(e), 'error');
      await this.updateBuildLog(build.id, ` ❌ Cloning failed!`, 'error');
      // With additionalInfos the CI callback learns about the failure as well.
      await this.setBuildStatus(build.id, BuildStatus.FAILED, additionalInfos);
      await this.checkALlBuildsOfContainerFailed(container);
      return false;
    }
  }
}
