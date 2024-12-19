import {CrudService, getStringIds, ServiceOptions} from '@lenne.tech/nest-server';
import {forwardRef, Inject, Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {PubSub} from 'graphql-subscriptions';
import {Model} from 'mongoose';
import {Container} from '../container/container.model';
import {ProjectService} from '../project/project.service';
import {UserService} from '../user/user.service';
import {TeamCreateInput} from './inputs/team-create.input';
import {Team, TeamDocument} from './team.model';
import {SystemStats} from './outputs/system-stats.output';
import {BuildService} from '../build/build.service';
import {Project} from '../project/project.model';
import * as si from 'systeminformation';
import {UserCreateInput} from "../user/inputs/user-create.input";
import {TeamInput} from "./inputs/team.input";

/**
 * Team service
 */
@Injectable()
export class TeamService extends CrudService<Team> {
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
    @InjectModel('Team') protected readonly teamModel: Model<TeamDocument>,
    @Inject('PUB_SUB') protected readonly pubSub: PubSub,
    private userService: UserService,
    @Inject(forwardRef(() => ProjectService))
    private projectService: ProjectService,
    @Inject(forwardRef(() => BuildService))
    private buildService: BuildService
  ) {
    super({mainDbModel: teamModel, mainModelConstructor: Team});
  }

  // ===================================================================================================================
  // Methods
  // ===================================================================================================================
  override async create(input: TeamCreateInput, serviceOptions?: ServiceOptions): Promise<Team> {
    // Get new Team
    const createdTeam = await super.create(input, serviceOptions);

    // Inform subscriber
    if (serviceOptions?.pubSub === undefined || serviceOptions.pubSub) {
      await this.pubSub.publish('teamCreated', Team.map(createdTeam));
    }

    // Add users team
    await this.userService.update(serviceOptions.currentUser.id, {team: createdTeam.id});

    // Return created Team
    return createdTeam;
  }

  override async update(id: string, input: TeamInput, serviceOptions?: ServiceOptions): Promise<Team> {
    const team = await super.update(id, input, serviceOptions);

    if (team.maintenance) {
      await this.buildService.pauseQueue();
    } else {
      await this.buildService.resumeQueue();
    }

    return team;
  }

  async getByCurrentUser(serviceOptions?: ServiceOptions) {
    return super.get(serviceOptions.currentUser.team, serviceOptions);
  }

  async getMembersOfTeam(serviceOptions?: ServiceOptions) {
    const team = await this.getByCurrentUser(serviceOptions);
    return this.userService.findForce({filterQuery: {team: getStringIds(team.id)}}, serviceOptions);
  }

  async inviteTeamMember(teamId: string, input: UserCreateInput, serviceOptions?: ServiceOptions) {
    const user = await this.userService.create(UserCreateInput.map({
      team: teamId,
      ...input,
    }), serviceOptions);
    await this.userService.sendPasswordResetMail(user.email, serviceOptions);
    return user;
  }

  async getBuildCount(id: string, serviceOptions?: ServiceOptions): Promise<number> {
    const team = await this.get(id, {
      ...serviceOptions,
      populate: [{path: 'projects', populate: {path: 'containers'}}]
    });
    let count = 0;

    for (const project of team.projects) {
      if ((project as Project).containers?.length) {
        for (const container of (project as Project).containers) {
          const builds = await this.buildService.findForContainer((container as Container).id);
          count = count + builds.length;
        }
      }
    }

    return count;
  }

  async getContainerCount(id: string, serviceOptions?: ServiceOptions): Promise<number> {
    const team = await this.get(id, {
      ...serviceOptions,
      populate: [{path: 'projects', populate: {path: 'containers'}}]
    });
    let count = 0;

    for (const project of team.projects) {
      count = count + (project as Project).containers?.length || 0;
    }

    return count;
  }

  async getSystemStats(id: string, serviceOptions?: ServiceOptions): Promise<SystemStats> {
    await this.get(id, serviceOptions);
    const cpu = await si.currentLoad();
    const time = await si.time();
    const memory = await si.mem();
    const containerStats = await si.dockerAll();

    const usedRam = Math.round(memory.used / 1024 / 1024 / 1024);
    const totalRam = Math.round(memory.total / 1024 / 1024 / 1024);
    const uptime = Math.round(time.uptime / 60 / 60);

    return {
      cpu: Number(cpu.currentLoad.toFixed(2)) ?? 0,
      memory: Number(usedRam.toFixed(2)) ?? 0,
      totalMemory: Number(totalRam.toFixed(2)) ?? 0,
      uptime: uptime + ' hours',
      containers: containerStats.map((container) => {
        return {
          id: container?.id,
          name: container?.name,
          memPercent: container?.memPercent ? Number(container?.memPercent.toFixed(2)) ?? 0 : 0,
          cpuPercent: container?.cpuPercent ? Number(container?.cpuPercent.toFixed(2)) ?? 0 : 0,
          state: container?.state,
          started: container?.started,
          restartCount: container?.restartCount ?? 0,
        };
      }),
    };
  }

  async getTeamByContainer(container: Container): Promise<Team> {
    const project = await this.projectService.getProjectByContainer(container);
    const teams = await this.teamModel.find({projects: project.id}).exec();

    if (!teams.length) {
      throw new NotFoundException();
    }

    return teams[0];
  }
}
