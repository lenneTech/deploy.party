import { FilterArgs, GraphQLServiceOptions, RoleEnum, Roles, ServiceOptions } from '@lenne.tech/nest-server';
import { Inject } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { WebPushCreateInput } from './inputs/web-push-create.input';
import { WebPushInput } from './inputs/web-push.input';
import { FindAndCountWebPushsResult } from './outputs/find-and-count-web-pushs-result.output';
import { WebPush } from './web-push.model';
import { WebPushService } from './web-push.service';

/**
 * Resolver to process with WebPush data
 */
@Roles(RoleEnum.ADMIN)
@Resolver(() => WebPush)
export class WebPushResolver {

  /**
   * Import services
   */
  constructor(
    private readonly webPushService: WebPushService,
    @Inject('PUB_SUB') protected readonly pubSub: PubSub
  ) {}

  // ===========================================================================
  // Queries
  // ===========================================================================

  /**
   * Get and total count WebPushs (via filter)
   */
  @Roles(RoleEnum.S_USER)
  @Query(() => FindAndCountWebPushsResult, { description: 'Find WebPushs (via filter)' })
  async findAndCountWebPushs(
    @GraphQLServiceOptions({ gqlPath: 'findAndCountWebPushs.items' }) serviceOptions: ServiceOptions,
    @Args() args?: FilterArgs
  ) {
    return await this.webPushService.findAndCount(args, {
      ...serviceOptions,
      inputType: FilterArgs,
    });
  }

  /**
   * Get WebPushs (via filter)
   */
   @Roles(RoleEnum.S_USER)
   @Query(() => [WebPush], { description: 'Find WebPushs (via filter)' })
   async findWebPushs(
     @GraphQLServiceOptions() serviceOptions: ServiceOptions,
     @Args() args?: FilterArgs
   ) {
     return await this.webPushService.find(args, {
       ...serviceOptions,
       inputType: FilterArgs
     });
   }

  /**
   * Get WebPush via ID
   */
  @Roles(RoleEnum.S_USER)
  @Query(() => WebPush, { description: 'Get WebPush with specified ID' })
  async getWebPush(
    @GraphQLServiceOptions() serviceOptions: ServiceOptions,
    @Args('id') id: string,
  ): Promise<WebPush> {
    return await this.webPushService.get(id, serviceOptions);
  }

  // ===========================================================================
  // Mutations
  // ===========================================================================

  /**
   * Create new WebPush
   */
  @Roles(RoleEnum.S_USER)
  @Mutation(() => WebPush, { description: 'Create a new WebPush' })
  async createWebPush(
    @GraphQLServiceOptions() serviceOptions: ServiceOptions,
    @Args('input') input: WebPushCreateInput
  ): Promise<WebPush> {
    return await this.webPushService.create(input, {
      ...serviceOptions,
      inputType: WebPushCreateInput
    });
  }

  /**
   * Delete existing WebPush
   */
  @Roles(RoleEnum.S_USER)
  @Mutation(() => WebPush, { description: 'Delete existing WebPush' })
  async deleteWebPush(
    @GraphQLServiceOptions() serviceOptions: ServiceOptions,
    @Args('id') id: string
  ): Promise<WebPush> {
    return await this.webPushService.delete(id, {
      ...serviceOptions,
      roles: [RoleEnum.ADMIN, RoleEnum.S_CREATOR]
    });
  }

  /**
   * Update existing WebPush
   */
  @Roles(RoleEnum.S_USER)
  @Mutation(() => WebPush, { description: 'Update existing WebPush' })
  async updateWebPush(
    @GraphQLServiceOptions() serviceOptions: ServiceOptions,
    @Args('id') id: string,
    @Args('input') input: WebPushInput
  ): Promise<WebPush> {
    return await this.webPushService.update(id, input, {
      serviceOptions,
      inputType: WebPushInput,
      roles: [RoleEnum.ADMIN, RoleEnum.S_CREATOR]
    });
  }

  // ===========================================================================
  // Subscriptions
  // ===========================================================================

  /**
   * Subscription for create WebPush
   */
  @Subscription(() => WebPush, {
    filter(this: WebPushResolver, payload, variables, context) {
      return context?.user?.hasRole?.(RoleEnum.ADMIN);
    },
    resolve: (value) => value,
  })
  async webPushCreated() {
    return this.pubSub.asyncIterableIterator('webPushCreated');
  }
}
