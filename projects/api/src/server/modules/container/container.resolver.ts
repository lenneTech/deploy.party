import {FilterArgs, GraphQLUser, RoleEnum, Roles} from '@lenne.tech/nest-server';
import {Inject} from '@nestjs/common';
import {Args, Info, Mutation, Query, Resolver, Subscription} from '@nestjs/graphql';
import {GraphQLResolveInfo} from 'graphql';
import {PubSub} from 'graphql-subscriptions';
import {User} from '../user/user.model';
import {Container} from './container.model';
import {ContainerService} from './container.service';
import {ContainerCreateInput} from './inputs/container-create.input';
import {ContainerInput} from './inputs/container.input';
import {ContainerStats} from './outputs/container-stats.output';
import {FindAndCountContainersResult} from './outputs/find-and-count-containers-result.output';
import {EventsOutput} from "./outputs/events.output";
import {ContainerHealthStatus} from "./enums/container-health-status.enum";

/**
 * Resolver to process with Container data
 */
@Roles(RoleEnum.ADMIN)
@Resolver(() => Container)
export class ContainerResolver {
  /**
   * Import services
   */
  constructor(
    private readonly containerService: ContainerService,
    @Inject('PUB_SUB') protected readonly pubSub: PubSub
  ) {}

  // ===========================================================================
  // Queries
  // ===========================================================================

  /**
   * Get and total count Containers (via filter)
   */
  @Roles(RoleEnum.S_USER)
  @Query(() => FindAndCountContainersResult, { description: 'Find Containers (via filter)' })
  async findAndCountContainers(@Info() info: GraphQLResolveInfo, @Args() args?: FilterArgs) {
    return await this.containerService.findAndCount(args, {
      fieldSelection: { info, select: 'findAndCountContainers.items' },
      inputType: FilterArgs,
    });
  }

  /**
   * Get Containers (via filter)
   */
  @Roles(RoleEnum.S_USER)
  @Query(() => [Container], { description: 'Find Containers (via filter)' })
  async findContainers(@Info() info: GraphQLResolveInfo, @GraphQLUser() user: User, @Args() args?: FilterArgs) {
    return await this.containerService.find(args, {
      currentUser: user,
      fieldSelection: { info, select: 'findContainers' },
      inputType: FilterArgs,
    });
  }

  /**
   * Get Container via ID
   */
  @Roles(RoleEnum.S_USER)
  @Query(() => Container, { description: 'Get Container with specified ID' })
  async getContainer(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
    @Args('id') id: string
  ): Promise<Container> {
    return await this.containerService.get(id, {
      currentUser: user,
      fieldSelection: { info, select: 'getContainer' },
    });
  }

  // ===========================================================================
  // Mutations
  // ===========================================================================

  /**
   * Create new Container
   */
  @Roles(RoleEnum.ADMIN)
  @Mutation(() => Container, { description: 'Create a new Container' })
  async createContainer(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
    @Args('projectId') projectId: string,
    @Args('input') input: ContainerCreateInput
  ): Promise<Container> {
    return await this.containerService.createForProject(projectId, input, {
      currentUser: user,
      fieldSelection: { info, select: 'createContainer' },
      inputType: ContainerCreateInput,
    });
  }

  @Roles(RoleEnum.ADMIN)
  @Mutation(() => Container, { description: 'Duplicate a Container' })
  async duplicateContainer(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
    @Args('containerId') containerId: string
  ): Promise<Container> {
    return await this.containerService.duplicateContainer(containerId, {
      currentUser: user,
      fieldSelection: { info, select: 'duplicateContainer' },
    });
  }

  /**
   * Delete existing Container
   */
  @Roles(RoleEnum.ADMIN)
  @Mutation(() => Container, { description: 'Delete existing Container' })
  async deleteContainer(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
    @Args('id') id: string
  ): Promise<Container> {
    return await this.containerService.deleteContainer(id, {
      currentUser: user,
      fieldSelection: { info, select: 'deleteContainer' },
      //roles: [RoleEnum.ADMIN, RoleEnum.S_CREATOR],
    });
  }

  /**
   * Update existing Container
   */
  @Roles(RoleEnum.ADMIN)
  @Mutation(() => Container, { description: 'Update existing Container' })
  async updateContainer(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
    @Args('id') id: string,
    @Args('input') input: ContainerInput
  ): Promise<Container> {
    return await this.containerService.update(id, input, {
      currentUser: user,
      fieldSelection: { info, select: 'updateContainer' },
      inputType: ContainerInput,
    });
  }

  /**
   * Deploy existing Container
   */
  @Roles(RoleEnum.ADMIN)
  @Mutation(() => Container, { description: 'Deploy existing Container' })
  async deployContainer(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
    @Args('id') id: string
  ): Promise<Container> {
    return await this.containerService.deploy(id, {
      currentUser: user,
      fieldSelection: { info, select: 'deployContainer' },
    });
  }

  /**
   * Stop deploy existing Container
   */
  @Roles(RoleEnum.ADMIN)
  @Mutation(() => Container, { description: 'Stop deploy existing Container' })
  async stopContainer(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
    @Args('id') id: string
  ): Promise<Container> {
    return await this.containerService.stopDeploy(id, {
      currentUser: user,
      fieldSelection: { info, select: 'stopContainer' },
    });
  }

  @Roles(RoleEnum.ADMIN)
  @Mutation(() => Boolean, { description: 'Stop all containers for team' })
  async stopAllContainers(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
  ): Promise<boolean> {
    return await this.containerService.stopAllContainers({
      currentUser: user,
      fieldSelection: { info, select: 'stopAllContainerForTeam' },
    });
  }

  @Roles(RoleEnum.ADMIN)
  @Mutation(() => Boolean, { description: 'Start all containers for team' })
  async startAllStoppedContainers(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
  ): Promise<boolean> {
    return await this.containerService.startAllStoppedContainers({
      currentUser: user,
      fieldSelection: { info, select: 'startAllStoppedContainers' },
    });
  }

  @Roles(RoleEnum.ADMIN)
  @Mutation(() => Boolean, { description: 'Start all containers for team' })
  async deleteVolume(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
    @Args('id') id: string
  ): Promise<boolean> {
    return await this.containerService.deleteVolume(id, {
      currentUser: user,
      fieldSelection: { info, select: 'deleteVolume' },
    });
  }

  @Roles(RoleEnum.S_USER)
  @Query(() => [String], { description: 'Get Container logs' })
  getContainerLogs(@Args('id') id: string, @Args('since', { nullable: true }) since?: string) {
    return this.containerService.getLogs(id, since);
  }

  @Roles(RoleEnum.S_USER)
  @Query(() => ContainerStats, { description: 'Get Container stats' })
  getContainerStats(@Args('id') id: string) {
    return this.containerService.getStats(id);
  }

  @Roles(RoleEnum.S_USER)
  @Query(() => ContainerHealthStatus, { description: 'Get Container health status' })
  getContainerHealthStatus(@Args('id') id: string) {
    return this.containerService.getDockerHealthStatus(id);
  }

  // ===========================================================================
  // Subscriptions
  // ===========================================================================

  /**
   * Subscription for create Build
   */
  @Subscription(() => EventsOutput, {
    filter(this: ContainerResolver, payload, variables, context) {
      return context?.user?.hasRole?.(RoleEnum.ADMIN);
    },
    resolve: (value) => {
      return { log: value };
    },
  })
  async events() {
    return this.pubSub.asyncIterableIterator('events');
  }
}
