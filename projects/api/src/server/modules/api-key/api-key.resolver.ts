import {FilterArgs, GraphQLServiceOptions, Restricted, RoleEnum, Roles, ServiceOptions} from '@lenne.tech/nest-server';
import {Args, Mutation, Query, Resolver} from '@nestjs/graphql';
import {ApiKeyCreateInput} from './inputs/api-key-create.input';
import {ApiKey} from './api-key.model';
import {ApiKeyService} from './api-key.service';

/**
 * Resolver to process with ApiKey data
 */
@Roles(RoleEnum.ADMIN)
@Resolver(() => ApiKey)
export class ApiKeyResolver {

  /**
   * Import services
   */
  constructor(
    private readonly apiKeyService: ApiKeyService,
  ) {}

  // ===========================================================================
  // Queries
  // ===========================================================================

  /**
   * Get ApiKeys (via filter)
   */
  @Restricted(RoleEnum.ADMIN)
   @Query(() => [ApiKey], { description: 'Find ApiKeys (via filter)' })
   async findApiKeys(
     @GraphQLServiceOptions() serviceOptions: ServiceOptions,
     @Args() args?: FilterArgs,
   ) {
     return await this.apiKeyService.find(args, {
       ...serviceOptions,
       inputType: FilterArgs,
     });
   }

  // ===========================================================================
  // Mutations
  // ===========================================================================

  /**
   * Create new ApiKey
   */
  @Restricted(RoleEnum.ADMIN)
  @Mutation(() => ApiKey, { description: 'Create a new ApiKey' })
  async createApiKey(
    @GraphQLServiceOptions() serviceOptions: ServiceOptions,
    @Args('input') input: ApiKeyCreateInput,
  ): Promise<ApiKey> {
    return await this.apiKeyService.create(input, {
      ...serviceOptions,
      inputType: ApiKeyCreateInput,
    });
  }

  /**
   * Delete existing ApiKey
   */
  @Restricted(RoleEnum.ADMIN)
  @Mutation(() => ApiKey, { description: 'Delete existing ApiKey' })
  async deleteApiKey(
    @GraphQLServiceOptions() serviceOptions: ServiceOptions,
    @Args('id') id: string,
  ): Promise<ApiKey> {
    return await this.apiKeyService.delete(id, {
      ...serviceOptions,
      roles: [RoleEnum.ADMIN, RoleEnum.S_CREATOR],
    });
  }
}
