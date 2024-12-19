import {CrudService, getStringIds, ServiceOptions} from '@lenne.tech/nest-server';
import {forwardRef, Inject, Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {PubSub} from 'graphql-subscriptions';
import {Model} from 'mongoose';
import {Container} from '../container/container.model';
import {TeamService} from '../team/team.service';
import {ProjectCreateInput} from './inputs/project-create.input';
import {Project, ProjectDocument} from './project.model';
import {ContainerService} from "../container/container.service";
import {ContainerHealthStatus} from "../container/enums/container-health-status.enum";
import {ContainerStatus} from "../container/enums/container-status.enum";

/**
 * Project service
 */
@Injectable()
export class ProjectService extends CrudService<Project> {
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
    @InjectModel('Project') protected readonly projectModel: Model<ProjectDocument>,
    @Inject('PUB_SUB') protected readonly pubSub: PubSub,
    @Inject(forwardRef(() => TeamService))
    private teamService: TeamService,
    @Inject(forwardRef(() => ContainerService))
    private containerService: ContainerService
  ) {
    super({ mainDbModel: projectModel, mainModelConstructor: Project });
  }

  // ===================================================================================================================
  // Methods
  // ===================================================================================================================

  async findProjectsByTeam(serviceOptions?: ServiceOptions) {
    const teamId = getStringIds(serviceOptions.currentUser?.team);
    if (!teamId) {
      throw new Error('Team id is needed.');
    }

    const team = await this.teamService.get(teamId);
    if (team.projects.length === 0) {
      return [];
    }

    const filterEle = team.projects.map((e) => {
      return {
        _id: e,
      };
    });

    const projects = await super.find(
      {
        filterQuery: {
          $or: filterEle,
        },
      },
      {...serviceOptions, populate: [{path: 'containers', populate: 'lastBuild'}, {path: 'subscribers'}]}
    );

    for (const project of projects) {
    const containerHealths = [];
      for (const container of project.containers) {
        if ((container as Container)?.id) {
          let containerHealth: ContainerHealthStatus;
          if (!(container as Container)?.healthCheckCmd) {
            containerHealth = (container as Container).status === ContainerStatus.DEPLOYED ? ContainerHealthStatus.HEALTHY : (container as Container).status === ContainerStatus.BUILDING ? ContainerHealthStatus.IDLE : ContainerHealthStatus.UNHEALTHY;
          } else {
            containerHealth = await this.containerService.getDockerHealthStatus((container as Container)?.id);
          }

          (container as Container).healthStatus = containerHealth
          containerHealths.push(containerHealth);
        }
      }

      const countOfUnhealthy = containerHealths.filter((e) => e === ContainerHealthStatus.UNHEALTHY)?.length ?? 0;
      project.healthStatus = countOfUnhealthy > 0 ? (countOfUnhealthy === project.containers.length ? ContainerHealthStatus.UNHEALTHY : ContainerHealthStatus.IDLE) : ContainerHealthStatus.HEALTHY;
    }

    return projects;
  }

  /**
   * Create new Project
   * Overwrites create method from CrudService
   */
  async createProject(teamId: string, input: ProjectCreateInput, serviceOptions?: ServiceOptions): Promise<Project> {
    const team = await this.teamService.get(teamId);

    const newInput: ProjectCreateInput = {
      ...input,
      subscribers: [getStringIds(serviceOptions.currentUser.id)]
    }

    // Get new Project
    const createdProject = await super.create(newInput, serviceOptions);

    // Inform subscriber
    if (serviceOptions?.pubSub === undefined || serviceOptions.pubSub) {
      await this.pubSub.publish('projectCreated', Project.map(createdProject));
    }

    team.projects.push(createdProject.id as any);
    await this.teamService.update(team.id, { projects: getStringIds(team.projects) });

    // Return created Project
    return createdProject;
  }

  async addContainer(projectId: string, container: Container): Promise<Project> {
    const project = await this.get(projectId, { force: true });

    if (!project) {
      throw new NotFoundException(`Project with id ${projectId} not found`);
    }

    project.containers.push(getStringIds(container.id) as any);
    return this.update(projectId, project, { force: true });
  }

  async getProjectByContainer(container: Container | string): Promise<Project | null> {
    const projects = await this.projectModel.find({ containers: getStringIds(container) }).exec();

    if (!projects.length) {
      throw new NotFoundException();
    }

    return projects[0];
  }

  updateByQuery(id: string, updateQuery: any) {
    return this.projectModel.updateOne({ _id: id }, updateQuery).exec();
  }

  async checkUserIsSubscribed(projectId: string, userId: string) {
    return this.projectModel.exists({ _id: projectId, subscribers: userId }).exec();
  }

  async getSubscribersOfProject(projectId: string): Promise<string[]> {
    const project = await this.projectModel.findOne({ _id: projectId }).exec();
    return project.subscribers as string[];
  }
}
