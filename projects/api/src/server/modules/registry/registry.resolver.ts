import { FilterArgs, GraphQLUser, RoleEnum, Roles } from '@lenne.tech/nest-server';
import { Inject } from '@nestjs/common';
import { Args, Info, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { GraphQLResolveInfo } from 'graphql';
import { PubSub } from 'graphql-subscriptions';
import { User } from '../user/user.model';
import { RegistryCreateInput } from './inputs/registry-create.input';
import { RegistryInput } from './inputs/registry.input';
import { FindAndCountRegistrysResult } from './outputs/find-and-count-registrys-result.output';
import { Registry } from './registry.model';
import { RegistryService } from './registry.service';

/**
 * Resolver to process with Registry data
 */
@Roles(RoleEnum.ADMIN)
@Resolver(() => Registry)
export class RegistryResolver {

  /**
   * Import services
   */
  constructor(
    private readonly registryService: RegistryService,
    @Inject('PUB_SUB') protected readonly pubSub: PubSub
  ) {}

  // ===========================================================================
  // Queries
  // ===========================================================================

  /**
   * Get and total count Registrys (via filter)
   */
  @Roles(RoleEnum.ADMIN)
  @Query(() => FindAndCountRegistrysResult, { description: 'Find Registrys (via filter)' })
  async findAndCountRegistrys(@Info() info: GraphQLResolveInfo, @Args() args?: FilterArgs) {
    return await this.registryService.findAndCount(args, {
      fieldSelection: { info, select: 'findAndCountRegistrys.items' },
      inputType: FilterArgs,
    });
  }

  /**
   * Get Registrys (via filter)
   */
   @Roles(RoleEnum.ADMIN)
   @Query(() => [Registry], { description: 'Find Registrys (via filter)' })
   async findRegistrys(
     @Info() info: GraphQLResolveInfo,
     @GraphQLUser() user: User,
     @Args() args?: FilterArgs
   ) {
     return await this.registryService.find(args, {
       currentUser: user,
       fieldSelection: { info, select: 'findRegistrys' },
       inputType: FilterArgs
     });
   }

  /**
   * Get Registry via ID
   */
  @Roles(RoleEnum.ADMIN)
  @Query(() => Registry, { description: 'Get Registry with specified ID' })
  async getRegistry(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
    @Args('id') id: string,
  ): Promise<Registry> {
    return await this.registryService.get(id, {
      currentUser: user,
      fieldSelection: { info, select: 'getRegistry' },
    });
  }

  // ===========================================================================
  // Mutations
  // ===========================================================================

  /**
   * Create new Registry
   */
  @Roles(RoleEnum.ADMIN)
  @Mutation(() => Registry, { description: 'Create a new Registry' })
  async createRegistry(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
    @Args('teamId') teamId: string,
    @Args('input') input: RegistryCreateInput
  ): Promise<Registry> {
    return await this.registryService.createRegistry(teamId, input, {
      currentUser: user,
      fieldSelection: { info, select: 'createRegistry' },
      inputType: RegistryCreateInput,
    });
  }

  /**
   * Delete existing Registry
   */
  @Roles(RoleEnum.ADMIN)
  @Mutation(() => Registry, { description: 'Delete existing Registry' })
  async deleteRegistry(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
    @Args('id') id: string
  ): Promise<Registry> {
    return await this.registryService.delete(id, {
      currentUser: user,
      fieldSelection: { info, select: 'deleteRegistry' },
      roles: [RoleEnum.ADMIN, RoleEnum.S_CREATOR]
    });
  }

  /**
   * Update existing Registry
   */
  @Roles(RoleEnum.ADMIN)
  @Mutation(() => Registry, { description: 'Update existing Registry' })
  async updateRegistry(
    @Info() info: GraphQLResolveInfo,
    @GraphQLUser() user: User,
    @Args('id') id: string,
    @Args('input') input: RegistryInput
  ): Promise<Registry> {
    return await this.registryService.update(id, input, {
      currentUser: user,
      fieldSelection: { info, select: 'updateRegistry' },
      inputType: RegistryInput,
      roles: [RoleEnum.ADMIN, RoleEnum.S_CREATOR]
    });
  }
}
