import {FilterArgs, GraphQLUser, RoleEnum, Roles} from '@lenne.tech/nest-server';
import {Inject} from '@nestjs/common';
import {Args, Info, Mutation, Query, Resolver, Subscription} from '@nestjs/graphql';
import {GraphQLResolveInfo} from 'graphql';
import {PubSub} from 'graphql-subscriptions';
import {User} from '../user/user.model';
import {BuildCreateInput} from './inputs/build-create.input';
import {BuildInput} from './inputs/build.input';
import {FindAndCountBuildsResult} from './outputs/find-and-count-builds-result.output';
import {Build} from './build.model';
import {BuildService} from './build.service';

/**
 * Resolver to process with Build data
 */
@Roles(RoleEnum.ADMIN)
@Resolver(() => Build)
export class BuildResolver {

  /**
   * Import services
   */
  constructor(
    private readonly buildService: BuildService,
    @Inject('PUB_SUB') protected readonly pubSub: PubSub
  ) {}

  // ===========================================================================
  // Queries
  // ===========================================================================

  /**
   * Get and total count Builds (via filter)
   */
  @Roles(RoleEnum.ADMIN)
  @Query(() => FindAndCountBuildsResult, { description: 'Find Builds (via filter)' })
  async findAndCountBuilds(@Info() info: GraphQLResolveInfo, @Args() args?: FilterArgs) {
    return await this.buildService.findAndCount(args, {
      fieldSelection: { info, select: 'findAndCountBuilds.items' },
      inputType: FilterArgs,
    });
  }

  /**
   * Get Builds (via filter)
   */
   @Roles(RoleEnum.S_USER)
   @Query(() => [Build], { description: 'Find Builds (via filter)' })
   async findBuilds(
     @Info() info: GraphQLResolveInfo,
     @GraphQLUser() user: User,
     @Args() args?: FilterArgs
   ) {
     return await this.buildService.find(args, {
       currentUser: user,
       fieldSelection: { info, select: 'findBuilds' },
       inputType: FilterArgs
     });
   }

  @Roles(RoleEnum.S_USER)
  @Query(() => [Build], { description: 'Find Builds (via filter)' })
  async findBuildsForContainer(
      @Info() info: GraphQLResolveInfo,
      @GraphQLUser() user: User,
      @Args('containerId') containerId: string,
  ) {
    return await this.buildService.findForContainer(containerId, {
      currentUser: user,
      fieldSelection: { info, select: 'findBuildsForContainer' },
      inputType: FilterArgs
    });
  }

  /**
   * Get Build via ID
   */
  @Roles(RoleEnum.S_USER)
  @Query(() => Build, { description: 'Get Build with specified ID' })
  async getBuild(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
    @Args('id') id: string,
  ): Promise<Build> {
    return await this.buildService.get(id, {
      currentUser: user,
      fieldSelection: { info, select: 'getBuild' },
    });
  }

  // ===========================================================================
  // Mutations
  // ===========================================================================

  /**
   * Create new Build
   */
  @Roles(RoleEnum.S_USER)
  @Mutation(() => Build, { description: 'Create a new Build' })
  async createBuild(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
    @Args('input') input: BuildCreateInput
  ): Promise<Build> {
    return await this.buildService.create(input, {
      currentUser: user,
      fieldSelection: { info, select: 'createBuild' },
      inputType: BuildCreateInput
    });
  }

  /**
   * Delete existing Build
   */
  @Roles(RoleEnum.S_USER)
  @Mutation(() => Build, { description: 'Delete existing Build' })
  async deleteBuild(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
    @Args('id') id: string
  ): Promise<Build> {
    return await this.buildService.delete(id, {
      currentUser: user,
      fieldSelection: { info, select: 'deleteBuild' },
      roles: [RoleEnum.ADMIN, RoleEnum.S_CREATOR]
    });
  }

  /**
   * Update existing Build
   */
  @Roles(RoleEnum.S_USER)
  @Mutation(() => Build, { description: 'Update existing Build' })
  async updateBuild(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
    @Args('id') id: string,
    @Args('input') input: BuildInput
  ): Promise<Build> {
    return await this.buildService.update(id, input, {
      currentUser: user,
      fieldSelection: { info, select: 'updateBuild' },
      inputType: BuildInput,
      roles: [RoleEnum.ADMIN, RoleEnum.S_CREATOR]
    });
  }

  @Roles(RoleEnum.S_USER)
  @Mutation(() => Boolean, { description: 'Restart existing Build' })
  async restartBuild(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
    @Args('id') id: string,
  ): Promise<boolean> {
    return await this.buildService.restart(id, {
      currentUser: user,
      fieldSelection: { info, select: 'restartBuild' },
      inputType: BuildInput,
      roles: [RoleEnum.ADMIN, RoleEnum.S_CREATOR]
    });
  }

  @Roles(RoleEnum.S_USER)
  @Mutation(() => Boolean, { description: 'Stop existing Build' })
  async stopBuild(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
    @Args('id') id: string,
  ): Promise<boolean> {
    return await this.buildService.stop(id, {
      currentUser: user,
      fieldSelection: { info, select: 'stopBuild' },
      inputType: BuildInput,
      roles: [RoleEnum.ADMIN, RoleEnum.S_CREATOR]
    });
  }

  // ===========================================================================
  // Subscriptions
  // ===========================================================================

  /**
   * Subscription for create Build
   */
  @Subscription(() => Build, {
    filter(this: BuildResolver, payload, variables, context) {
      return context?.user?.hasRole?.(RoleEnum.ADMIN);
    },
    resolve: (value) => value,
  })
  async buildCreated() {
    return this.pubSub.asyncIterableIterator('buildCreated');
  }
}
