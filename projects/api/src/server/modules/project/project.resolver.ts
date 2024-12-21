import { FilterArgs, GraphQLUser, RoleEnum, Roles } from '@lenne.tech/nest-server';
import { Inject } from '@nestjs/common';
import { Args, Info, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { GraphQLResolveInfo } from 'graphql';
import { PubSub } from 'graphql-subscriptions';
import { User } from '../user/user.model';
import { ProjectCreateInput } from './inputs/project-create.input';
import { ProjectInput } from './inputs/project.input';
import { FindAndCountProjectsResult } from './outputs/find-and-count-projects-result.output';
import { Project } from './project.model';
import { ProjectService } from './project.service';

/**
 * Resolver to process with Project data
 */
@Roles(RoleEnum.ADMIN)
@Resolver(() => Project)
export class ProjectResolver {
  /**
   * Import services
   */
  constructor(private readonly projectService: ProjectService, @Inject('PUB_SUB') protected readonly pubSub: PubSub) {}

  // ===========================================================================
  // Queries
  // ===========================================================================

  /**
   * Get and total count Projects (via filter)
   */
  @Roles(RoleEnum.ADMIN)
  @Query(() => FindAndCountProjectsResult, { description: 'Find Projects (via filter)' })
  async findAndCountProjects(@Info() info: GraphQLResolveInfo, @Args() args?: FilterArgs) {
    return await this.projectService.findAndCount(args, {
      fieldSelection: { info, select: 'findAndCountProjects.items' },
      inputType: FilterArgs,
    });
  }

  /**
   * Get Projects (via filter)
   */
  @Roles(RoleEnum.S_USER)
  @Query(() => [Project], { description: 'Find Projects (via filter)' })
  async findProjects(@Info() info: GraphQLResolveInfo, @GraphQLUser() user: User) {
    return await this.projectService.findProjectsByTeam({
      currentUser: user,
      fieldSelection: { info, select: 'findProjects' },
      inputType: FilterArgs,
    });
  }

  /**
   * Get Project via ID
   */
  @Roles(RoleEnum.S_USER)
  @Query(() => Project, { description: 'Get Project with specified ID' })
  async getProject(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
    @Args('id') id: string
  ): Promise<Project> {
    return await this.projectService.get(id, {
      currentUser: user,
      fieldSelection: { info, select: 'getProject' },
    });
  }

  // ===========================================================================
  // Mutations
  // ===========================================================================

  /**
   * Create new Project
   */
  @Roles(RoleEnum.ADMIN)
  @Mutation(() => Project, { description: 'Create a new Project' })
  async createProject(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
    @Args('teamId') teamId: string,
    @Args('input') input: ProjectCreateInput
  ): Promise<Project> {
    return await this.projectService.createProject(teamId, input, {
      currentUser: user,
      fieldSelection: { info, select: 'createProject' },
      inputType: ProjectCreateInput,
    });
  }

  /**
   * Delete existing Project
   */
  @Roles(RoleEnum.ADMIN)
  @Mutation(() => Project, { description: 'Delete existing Project' })
  async deleteProject(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
    @Args('id') id: string
  ): Promise<Project> {
    return await this.projectService.delete(id, {
      currentUser: user,
      fieldSelection: { info, select: 'deleteProject' },
      roles: [RoleEnum.ADMIN, RoleEnum.S_CREATOR],
    });
  }

  /**
   * Update existing Project
   */
  @Roles(RoleEnum.ADMIN)
  @Mutation(() => Project, { description: 'Update existing Project' })
  async updateProject(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
    @Args('id') id: string,
    @Args('input') input: ProjectInput
  ): Promise<Project> {
    return await this.projectService.update(id, input, {
      currentUser: user,
      fieldSelection: { info, select: 'updateProject' },
      inputType: ProjectInput,
      roles: [RoleEnum.ADMIN, RoleEnum.S_CREATOR],
    });
  }
}
