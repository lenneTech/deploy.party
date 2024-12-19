import {FilterArgs, GraphQLUser, RoleEnum, Roles} from '@lenne.tech/nest-server';
import {Inject} from '@nestjs/common';
import {Args, Info, Mutation, Query, Resolver} from '@nestjs/graphql';
import {GraphQLResolveInfo} from 'graphql';
import {PubSub} from 'graphql-subscriptions';
import {User} from '../user/user.model';
import {TeamCreateInput} from './inputs/team-create.input';
import {TeamInput} from './inputs/team.input';
import {FindAndCountTeamsResult} from './outputs/find-and-count-teams-result.output';
import {Team} from './team.model';
import {TeamService} from './team.service';
import {SystemStats} from './outputs/system-stats.output';
import {UserCreateInput} from "../user/inputs/user-create.input";
import {DeployRoleEnum} from "../../common/enums/deploy-role.enum";

/**
 * Resolver to process with Team data
 */
@Roles(RoleEnum.ADMIN)
@Resolver(() => Team)
export class TeamResolver {
  /**
   * Import services
   */
  constructor(private readonly teamService: TeamService, @Inject('PUB_SUB') protected readonly pubSub: PubSub) {}

  // ===========================================================================
  // Queries
  // ===========================================================================

  /**
   * Get and total count Teams (via filter)
   */
  @Roles(RoleEnum.ADMIN)
  @Query(() => FindAndCountTeamsResult, { description: 'Find Teams (via filter)' })
  async findAndCountTeams(@Info() info: GraphQLResolveInfo, @Args() args?: FilterArgs) {
    return await this.teamService.findAndCount(args, {
      fieldSelection: { info, select: 'findAndCountTeams.items' },
      inputType: FilterArgs,
    });
  }

  /**
   * Get Teams (via filter)
   */
  @Roles(DeployRoleEnum.ADMIN)
  @Query(() => [Team], { description: 'Find Teams (via filter)' })
  async findTeams(@Info() info: GraphQLResolveInfo, @GraphQLUser() user: User, @Args() args?: FilterArgs) {
    return await this.teamService.find(args, {
      currentUser: user,
      fieldSelection: { info, select: 'findTeams' },
      inputType: FilterArgs,
    });
  }

  /**
   * Get Team via ID
   */
  @Roles(RoleEnum.S_USER)
  @Query(() => Team, { description: 'Get Team with specified ID' })
  async getTeam(@Info() info: GraphQLResolveInfo, @GraphQLUser() user: User, @Args('id') id: string): Promise<Team> {
    return await this.teamService.get(id, {
      currentUser: user,
      fieldSelection: { info, select: 'getTeam' },
    });
  }

  @Roles(RoleEnum.S_USER)
  @Query(() => Number, { description: 'Get container count' })
  async getContainerCount(
    @Args('id') id: string,
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User
  ): Promise<number> {
    return await this.teamService.getContainerCount(id, {
      currentUser: user,
      fieldSelection: { info, select: 'getContainerCount' },
    });
  }

  @Roles(RoleEnum.S_USER)
  @Query(() => Number, { description: 'Get build count' })
  async getBuildCount(
    @Args('id') id: string,
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User
  ): Promise<number> {
    return await this.teamService.getBuildCount(id, {
      currentUser: user,
      fieldSelection: { info, select: 'getBuildCount' },
    });
  }

  @Roles(RoleEnum.S_USER)
  @Query(() => SystemStats, { description: 'Get build count' })
  async getSystemStats(
    @Args('id') id: string,
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User
  ): Promise<SystemStats> {
    return await this.teamService.getSystemStats(id, {
      currentUser: user,
      fieldSelection: { info, select: 'getSystemStats' },
    });
  }

  @Roles(RoleEnum.S_USER)
  @Query(() => Team, { description: 'Get Team by current user' })
  async getTeamByCurrentUser(@Info() info: GraphQLResolveInfo, @GraphQLUser() user: User): Promise<Team> {
    return await this.teamService.getByCurrentUser({
      currentUser: user,
      fieldSelection: { info, select: 'getTeamByCurrentUser' },
    });
  }

  @Roles(DeployRoleEnum.ADMIN)
  @Query(() => [User], { description: 'Get members of Team by current user' })
  async getMembersOfTeam(@Info() info: GraphQLResolveInfo, @GraphQLUser() user: User): Promise<User[]> {
    return await this.teamService.getMembersOfTeam({
      currentUser: user,
      fieldSelection: { info, select: 'getMembersOfTeam' },
    });
  }

  // ===========================================================================
  // Mutations
  // ===========================================================================

  /**
   * Create new Team
   */
  @Roles(DeployRoleEnum.ADMIN)
  @Mutation(() => Team, { description: 'Create a new Team' })
  async createTeam(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
    @Args('input') input: TeamCreateInput
  ): Promise<Team> {
    return await this.teamService.create(input, {
      currentUser: user,
      fieldSelection: { info, select: 'createTeam' },
      inputType: TeamCreateInput,
    });
  }

  /**
   * Delete existing Team
   */
  @Roles(DeployRoleEnum.ADMIN)
  @Mutation(() => Team, { description: 'Delete existing Team' })
  async deleteTeam(@Info() info: GraphQLResolveInfo, @GraphQLUser() user: User, @Args('id') id: string): Promise<Team> {
    return await this.teamService.delete(id, {
      currentUser: user,
      fieldSelection: { info, select: 'deleteTeam' },
      roles: [RoleEnum.ADMIN, RoleEnum.S_CREATOR],
    });
  }

  /**
   * Update existing Team
   */
  @Roles(DeployRoleEnum.ADMIN)
  @Mutation(() => Team, { description: 'Update existing Team' })
  async updateTeam(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
    @Args('id') id: string,
    @Args('input') input: TeamInput
  ): Promise<Team> {
    return await this.teamService.update(id, input, {
      currentUser: user,
      fieldSelection: { info, select: 'updateTeam' },
      inputType: TeamInput,
      roles: [RoleEnum.ADMIN, RoleEnum.S_CREATOR],
    });
  }

  @Roles(DeployRoleEnum.ADMIN)
  @Mutation(() => User, { description: 'Invite user to existing Team' })
  async inviteTeamMember(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
    @Args('teamId') teamId: string,
    @Args('input') input: UserCreateInput,
  ): Promise<User> {
    return await this.teamService.inviteTeamMember(
      teamId,
      input,
      {
      currentUser: user,
      fieldSelection: { info, select: 'inviteTeamMember' },
    });
  }
}
