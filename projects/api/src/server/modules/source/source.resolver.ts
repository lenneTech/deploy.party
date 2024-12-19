import {FilterArgs, GraphQLUser, RoleEnum, Roles} from '@lenne.tech/nest-server';
import {Inject} from '@nestjs/common';
import {Args, Info, Mutation, Query, Resolver} from '@nestjs/graphql';
import {GraphQLResolveInfo} from 'graphql';
import {PubSub} from 'graphql-subscriptions';
import {User} from '../user/user.model';
import {SourceCreateInput} from './inputs/source-create.input';
import {SourceInput} from './inputs/source.input';
import {Source} from './source.model';
import {SourceService} from './source.service';

/**
 * Resolver to process with Source data
 */
@Roles(RoleEnum.ADMIN)
@Resolver(() => Source)
export class SourceResolver {

  /**
   * Import services
   */
  constructor(
    private readonly sourceService: SourceService,
    @Inject('PUB_SUB') protected readonly pubSub: PubSub
  ) {}

  // ===========================================================================
  // Queries
  // ===========================================================================

  /**
   * Get Sources (via filter)
   */
   @Roles(RoleEnum.ADMIN)
   @Query(() => [Source], { description: 'Find Source (via filter)' })
   async findSources(
     @Info() info: GraphQLResolveInfo,
     @GraphQLUser() user: User,
     @Args() args?: FilterArgs
   ) {
     return await this.sourceService.find(args, {
       currentUser: user,
       fieldSelection: { info, select: 'findSources' },
       inputType: FilterArgs
     });
   }

  /**
   * Get Source via ID
   */
  @Roles(RoleEnum.ADMIN)
  @Query(() => Source, { description: 'Get Source with specified ID' })
  async getSource(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
    @Args('id') id: string,
  ): Promise<Source> {
    return await this.sourceService.get(id, {
      currentUser: user,
      fieldSelection: { info, select: 'getSource' },
    });
  }

  // ===========================================================================
  // Mutations
  // ===========================================================================

  /**
   * Create new Source
   */
  @Roles(RoleEnum.ADMIN)
  @Mutation(() => Source, { description: 'Create a new Source' })
  async createSource(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
    @Args('input') input: SourceCreateInput
  ): Promise<Source> {
    return await this.sourceService.create(input, {
      currentUser: user,
      fieldSelection: { info, select: 'createSource' },
      inputType: SourceCreateInput
    });
  }

  /**
   * Delete existing Source
   */
  @Roles(RoleEnum.ADMIN)
  @Mutation(() => Source, { description: 'Delete existing Source' })
  async deleteSource(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
    @Args('id') id: string
  ): Promise<Source> {
    return await this.sourceService.delete(id, {
      currentUser: user,
      fieldSelection: { info, select: 'deleteSource' },
      roles: [RoleEnum.ADMIN, RoleEnum.S_CREATOR]
    });
  }

  /**
   * Update existing Source
   */
  @Roles(RoleEnum.ADMIN)
  @Mutation(() => Source, { description: 'Update existing Source' })
  async updateSource(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
    @Args('id') id: string,
    @Args('input') input: SourceInput
  ): Promise<Source> {
    return await this.sourceService.update(id, input, {
      currentUser: user,
      fieldSelection: { info, select: 'updateSource' },
      inputType: SourceInput,
      roles: [RoleEnum.ADMIN, RoleEnum.S_CREATOR]
    });
  }
}
