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
import {TagMatchType} from "./enums/tag-match-type.enum";

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

  override async update(id: string, input: any, serviceOptions?: ServiceOptions): Promise<Container> {
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


    // check if name, type, registry, source, repositoryId, deploymentType, url and port is set
    if (
      container.kind === ContainerKind.APPLICATION &&
      (!container.name ||
      !container.registry ||
      !container.type ||
      !container.source ||
      !container.repositoryId ||
      !container.deploymentType ||
      !container.url ||
        (container.type !== ContainerType.STATIC && !container.port))
    ) {
      throw new InternalServerErrorException('Container is missing required fields');
    }

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
    return this.containerModel.updateOne({ _id: id }, { $push: { logs: {$each: logs, $slice: -1000} } }).exec();
  }

  async getStats(containerId: string) {
    const container = await super.get(containerId);
    if (container.status !== ContainerStatus.DEPLOYED) {
      return null;
    }

    return this.dockerService.getStats(container);
  }

  async getContainerForWebhook(id: string, source: string): Promise<Container[]> {
    // Find containers for branch deployments (existing behavior)
    const branchContainers = await this.containerModel.find({
      repositoryId: id,
      deploymentType: DeploymentType.BRANCH,
      branch: source
    }, null, {populate: 'source'}).exec();

    // Find containers for exact tag matching (existing behavior)
    const exactTagContainers = await this.containerModel.find({
      repositoryId: id,
      deploymentType: DeploymentType.TAG,
      $or: [
        { tagMatchType: TagMatchType.EXACT },
        { tagMatchType: { $exists: false } }, // null for backward compatibility
        { tagMatchType: null }
      ],
      tag: source
    }, null, {populate: 'source'}).exec();

    // Find containers for tag pattern matching (new functionality)
    const patternTagContainers = await this.containerModel.find({
      repositoryId: id,
      deploymentType: DeploymentType.TAG,
      tagMatchType: TagMatchType.PATTERN,
      tagPattern: { $exists: true, $ne: null }
    }, null, {populate: 'source'}).exec();

    // Filter pattern containers by matching pattern
    const matchingPatternContainers = patternTagContainers.filter(container =>
      this.matchesTagPattern(source, container.tagPattern)
    );

    const allContainers = [...branchContainers, ...exactTagContainers, ...matchingPatternContainers];

    if (!allContainers.length) {
      throw new NotFoundException();
    }

    return allContainers;
  }

  private matchesTagPattern(tag: string, pattern: string): boolean {
    if (!pattern || !tag) {
      return false;
    }

    // Handle special patterns with character classes and regex anchors
    let regexPattern = pattern;

    // Check if pattern already ends with $ (regex anchor)
    const hasEndAnchor = regexPattern.endsWith('$');
    if (hasEndAnchor) {
      regexPattern = regexPattern.slice(0, -1); // Remove $ temporarily
    }

    // Convert character classes like [0-9] and + quantifiers to proper regex
    // Don't escape [], +, or $ when they're part of regex syntax
    regexPattern = regexPattern
      .replace(/[.^{}()|\\]/g, '\\$&')       // Escape special chars but keep [], +, $
      .replace(/\*/g, '.*')                   // Replace * with .*
      .replace(/\?/g, '.');                   // Replace ? with .

    // Add anchors - ^ at start is always added, $ only if pattern had it or if no .* at end
    const finalPattern = hasEndAnchor || !regexPattern.endsWith('.*')
      ? `^${regexPattern}$`
      : `^${regexPattern}`;

    try {
      const regex = new RegExp(finalPattern);
      return regex.test(tag);
    } catch (error) {
      console.error(`Invalid tag pattern: ${pattern}`, error);
      return false;
    }
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

  getContainerSource(container: Container, path = false) {
    if (container.deploymentType === DeploymentType.BRANCH) {
      return container.branch;
    }

    if (container.deploymentType === DeploymentType.TAG && container.tagMatchType === TagMatchType.PATTERN) {
      if (!path) {
        return container.tag;
      } else {
        // Convert tag pattern to a path-like format
        const pattern = container.tagPattern;
        // remove all special characters except alphanumeric, underscore, and hyphen
        return pattern.replace(/[^a-zA-Z0-9_-]/g, '_');
      }
    }

    if (container.deploymentType === DeploymentType.TAG) {
      return container.tag;
    }

    // Default case if no deployment type matches
    return 'unknown';
  }
}
