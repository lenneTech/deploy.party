import {CrudService, getObjectIds, getStringIds, ServiceOptions} from '@lenne.tech/nest-server';
import {
  BeforeApplicationShutdown,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnApplicationBootstrap
} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {PubSub} from 'graphql-subscriptions';
import {Model} from 'mongoose';
import {BuildService} from '../build/build.service';
import {ProjectService} from '../project/project.service';
import {Container, ContainerDocument} from './container.model';
import {ContainerStatus} from './enums/container-status.enum';
import {ContainerCreateInput} from './inputs/container-create.input';
import {DockerService} from "../../common/services/docker.service";
import {FileService} from "../../common/services/file.service";
import {ContainerHealthStatus} from "./enums/container-health-status.enum";
import {ContainerKind} from "./enums/container-kind.enum";
import {ContainerType} from "./enums/container-type.enum";
import {DeploymentType} from "./enums/deployment-type.enum";

/**
 * Container service
 */
@Injectable()
export class ContainerService extends CrudService<Container> implements OnApplicationBootstrap, BeforeApplicationShutdown {
  // ===================================================================================================================
  // Properties
  // ===================================================================================================================
  dockerEventsProcess: any;
  statusChangeInProgress: string[] = [];

  // ===================================================================================================================
  // Injections
  // ===================================================================================================================
  constructor(
    @InjectModel('Container') protected readonly containerModel: Model<ContainerDocument>,
    @Inject('PUB_SUB') protected readonly pubSub: PubSub,
    @Inject(forwardRef(() => DockerService))
    private dockerService: DockerService,
    @Inject(forwardRef(() => ProjectService))
    private projectService: ProjectService,
    @Inject(forwardRef(() => BuildService))
    private buildService: BuildService,
    private fileService: FileService,
  ) {
    super({mainDbModel: containerModel, mainModelConstructor: Container});
  }

  // ===================================================================================================================
  // Hooks
  // ===================================================================================================================
  onApplicationBootstrap(): any {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {spawn} = require('child_process');
    this.dockerEventsProcess = spawn('docker', ['events', '--format', '{{json .}}']);
    console.debug('Start listing for Docker events');

    this.dockerEventsProcess.stdout.on('data', (data) => {
      if (data.toString()) {
        const lines = data.toString().split('\n');
        lines.forEach((line) => {
          if (line) {
            const eventInfo = JSON.parse(line);

            if (eventInfo.Actor && eventInfo.Actor.Attributes && eventInfo.Actor.Attributes['deploy.party.id']) {
              const containerId = eventInfo.Actor.Attributes['deploy.party.id'];
              if (this.statusChangeInProgress.includes(containerId)) {
                return;
              }

              const containerStatus = eventInfo.status;
              this.statusChangeInProgress.push(containerId);

              this.mainDbModel.findOne({_id: getObjectIds(containerId)}).exec().then(async (container) => {
                if (container) {
                  if (container.status !== ContainerStatus.STOPPED_BY_SYSTEM) {
                    if (containerStatus === 'start') {
                      await this.update(containerId, {status: ContainerStatus.DEPLOYED});
                    }
                    this.statusChangeInProgress = this.statusChangeInProgress.filter((e) => e !== containerId);
                  }
                }
              });
            }
          }
        });
      }
    });

    this.dockerEventsProcess.stderr.on('data', (data) => {
      console.error(`Docker event error: ${data}`);
    });

    this.dockerEventsProcess.on('close', (code) => {
      console.debug(`Docker event child process exited with code ${code}`);
    });
  }

  beforeApplicationShutdown(): any {
    if (this.dockerEventsProcess) {
      console.debug('Docker event process stopped.');
      this.dockerEventsProcess.kill();
    }
  }

  // ===================================================================================================================
  // Methods
  // ===================================================================================================================

  /**
   * Create new Container
   * Overwrites create method from CrudService
   */
  async createForProject(
    projectId: string,
    input: ContainerCreateInput,
    serviceOptions?: ServiceOptions
  ): Promise<Container> {
    // Get new Container
    if (input.kind === ContainerKind.CUSTOM) {
      input.type = ContainerType.CUSTOM;
    }

    const createdContainer = await super.create(input, serviceOptions);

    await this.projectService.addContainer(projectId, createdContainer);

    // Inform subscriber
    if (serviceOptions?.pubSub === undefined || serviceOptions.pubSub) {
      await this.pubSub.publish('containerCreated', Container.map(createdContainer));
    }

    // Return created Container
    return createdContainer;
  }

  async duplicateContainer(containerId: string, serviceOptions?: ServiceOptions): Promise<Container> {
    const container = await this.get(containerId, serviceOptions);
    const project = await this.projectService.getProjectByContainer(container);

    const input: any = container;
    delete container.id;
    delete container.lastLogsFrom;
    delete container.lastBuild;
    delete container.lastEditedAt;
    delete container.lastDeployedAt;
    delete container.logs;
    delete container.createdBy;
    delete container.createdAt;
    delete container.updatedBy;
    delete container.updatedAt;

    container.status = ContainerStatus.DRAFT;
    container.name = `${container.name} - Copy`;

    return this.createForProject(getStringIds(project.id), input);
  }

  override async update(id: string, input: Partial<Container>, serviceOptions?: ServiceOptions): Promise<Container> {
    if (!input.lastDeployedAt && !input.lastLogsFrom) {
      input.lastEditedAt = new Date();
    }

    return super.update(id, input, serviceOptions);
  }

  async setStatus(id: string, status: ContainerStatus) {
    return this.containerModel.updateOne({_id: id}, {status}).exec();
  }

  async deleteContainer(containerId: string, serviceOptions?: ServiceOptions): Promise<Container> {
    const container = await super.get(containerId);

    if (container.status === ContainerStatus.DEPLOYED) {
      throw new Error('Container Deployment needs to stoped before delete.');
    }

    await this.fileService.removeProjectFolder(container);

    const project = await this.projectService.getProjectByContainer(container);
    await this.projectService.updateByQuery(getStringIds(project.id), {$pull: {containers: containerId}});

    return this.delete(container.id, serviceOptions);
  }

  async deploy(containerId: string, serviceOptions?: ServiceOptions): Promise<Container> {
    const container = await super.get(containerId, {...serviceOptions, ...{populate: [{path: 'registry'}, {path: 'source'}]}});

    if (!(await this.fileService.checkProjectExist(container))) {
      await this.fileService.createProjectFolder(container);
    }

    if (container.env) {
      await this.dockerService.createEnvFile(container);
    }

    if (container.registry) {
      await this.dockerService.createDockerRegistryCredentials(container);
    }

    await this.dockerService.createDockerfile(container);
    await this.dockerService.createDockerComposeFile(container);

    if (
      container.status === ContainerStatus.STOPPED ||
      container.status === ContainerStatus.STOPPED_BY_SYSTEM ||
      container.status === ContainerStatus.DIED) {

      if (container.registry) {
        await this.dockerService.createDockerRegistryCredentials(container);
      }

      await this.dockerService.createDockerfile(container);
      await this.dockerService.createDockerComposeFile(container);
    }

    if (container.kind === ContainerKind.APPLICATION || container.kind === ContainerKind.CUSTOM) {
      // Set state
      await this.update(containerId, {status: ContainerStatus.BUILDING, lastDeployedAt: new Date()});

      // create build
      await this.buildService.create({
        container: containerId,
      });
    } else {
      // Set state
      await this.update(containerId, {status: ContainerStatus.DEPLOYED, lastDeployedAt: new Date()});

      await this.dockerService.deploy(container);
    }

    return container;
  }

  async stopDeploy(containerId: string, serviceOptions?: ServiceOptions): Promise<Container> {
    const container = await super.get(containerId, {...serviceOptions, populate: ['registry']});

    if (container.status === ContainerStatus.BUILDING) {
      const build = await this.buildService.getLastBuild(containerId);
      await this.buildService.stop(build.id);

      try {
        await this.fileService.removeDockerFiles(container);
      } catch (e) {
        console.error(e);
      }
      return this.update(containerId, {status: ContainerStatus.STOPPED});
    } else if (container.status === ContainerStatus.DEPLOYED || container.status === ContainerStatus.DIED) {
      try {
        await this.dockerService.stop(container);
        await this.fileService.removeDockerFiles(container);
      } catch (e) {
        return this.update(containerId, {status: ContainerStatus.STOPPED});
      }

      // Set state
      return this.update(containerId, {status: ContainerStatus.STOPPED});
    } else {
      return container;
    }
  }

  async refreshLogs(container: Container) {
    const date = new Date();
    const logs = await this.getLogs(container.id, container.lastLogsFrom ? new Date(container.lastLogsFrom).toISOString() : undefined);

    if (!logs) {
      return;
    }

    await this.updateLog(container.id, logs);
    await this.update(container.id, {lastLogsFrom: date});
  }

  async getLogs(containerId: string, since: string) {
    const container = await super.get(containerId);
    if (container.status !== ContainerStatus.DEPLOYED && container.status !== ContainerStatus.DIED) {
      return null;
    }

    return this.dockerService.getLogs(container, since);
  }

  async updateLog(id: string, logs: string[]) {
    return this.containerModel.updateOne({ _id: id }, { $push: { logs: {$each: logs, $slice: -3000} } }).exec();
  }

  async getStats(containerId: string) {
    const container = await super.get(containerId);
    if (container.status !== ContainerStatus.DEPLOYED) {
      return null;
    }

    return this.dockerService.getStats(container);
  }

  async getContainerForWebhook(id: string, source: string): Promise<Container[]> {
    const containers = await this.containerModel.find({$and: [{repositoryId: id}, {$or: [{branch: source}, {tag: source}]}]}, null, {populate: 'source'}).exec();

    if (!containers.length) {
      throw new NotFoundException();
    }

    return containers;
  }

  async findContainersForProject(projectId: string, serviceOptions?: ServiceOptions): Promise<Container[]> {
    const project = await this.projectService.getForce(projectId, serviceOptions);

    if (!project) {
      throw new NotFoundException();
    }

    return this.findForce({filterQuery: {_id: {$in: getObjectIds(project.containers)}}, ...serviceOptions});
  }

  async getDockerHealthStatus(containerId: string): Promise<ContainerHealthStatus> {
    const container = await super.get(containerId);
    if (container.status !== ContainerStatus.DEPLOYED) {
      return null;
    }

    const status = await this.dockerService.getHealthStatus(container);
    return status ? status : ContainerHealthStatus.UNHEALTHY;
  }

  async stopAllContainers(serviceOptions?: ServiceOptions) {
    const projects = await this.projectService.find({}, {...serviceOptions, ...{ populate: ['containers'] }});

    for (const project of projects) {
      for (const container of project.containers) {

        if ((container as Container).status !== ContainerStatus.DEPLOYED) {
          continue;
        }

        await this.stopDeploy((container as Container).id as string, serviceOptions);
        await this.update((container as Container).id as string, {status: ContainerStatus.STOPPED_BY_SYSTEM})
      }
    }

    return true;
  }

  async startAllStoppedContainers(serviceOptions?: ServiceOptions) {
    const containers = await this.find({filterQuery: {status: ContainerStatus.STOPPED_BY_SYSTEM}}, serviceOptions);

    for (const container of containers) {
      await this.deploy(getStringIds(container.id), serviceOptions);
    }

    return true;
  }

  async deleteVolume(id: string, serviceOptions?: ServiceOptions) {
    const container = await this.get(id, serviceOptions);

    if (
      container.status !== ContainerStatus.DIED &&
      container.status !== ContainerStatus.STOPPED
    ) {
      throw new InternalServerErrorException('Container status needs to be STOPPED.')
    }

    return await this.dockerService.deleteVolume(container);
  }

  getContainerSource(container: Container) {
    switch (container.deploymentType) {
      case DeploymentType.BRANCH:
        return container.branch;
      case DeploymentType.TAG:
        return container.tag;
      default:
        return '';
    }
  }
}
