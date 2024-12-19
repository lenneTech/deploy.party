import {
  FilterArgs,
  getStringIds,
  GraphQLServiceOptions,
  RoleEnum,
  Roles,
  ServiceOptions
} from '@lenne.tech/nest-server';
import {Inject} from '@nestjs/common';
import {Args, Mutation, Query, Resolver} from '@nestjs/graphql';
import {PubSub} from 'graphql-subscriptions';
import {BackupCreateInput} from './inputs/backup-create.input';
import {BackupInput} from './inputs/backup.input';
import {FindAndCountBackupsResult} from './outputs/find-and-count-backups-result.output';
import {Backup} from './backup.model';
import {BackupService} from './backup.service';
import {S3BackupListOutput} from "./outputs/s3-backup-list.output";

/**
 * Resolver to process with Backup data
 */
@Roles(RoleEnum.ADMIN)
@Resolver(() => Backup)
export class BackupResolver {

  /**
   * Import services
   */
  constructor(
    private readonly backupService: BackupService,
    @Inject('PUB_SUB') protected readonly pubSub: PubSub
  ) {}

  // ===========================================================================
  // Queries
  // ===========================================================================

  /**
   * Get and total count Backups (via filter)
   */
  @Roles(RoleEnum.ADMIN)
  @Query(() => FindAndCountBackupsResult, { description: 'Find Backups (via filter)' })
  async findAndCountBackups(
    @GraphQLServiceOptions({ gqlPath: 'findAndCountBackups.items' }) serviceOptions: ServiceOptions,
    @Args() args?: FilterArgs
  ) {
    return await this.backupService.findAndCount(args, {
      ...serviceOptions,
      inputType: FilterArgs,
    });
  }

  /**
   * Get Backups (via filter)
   */
   @Roles(RoleEnum.ADMIN)
   @Query(() => [Backup], { description: 'Find Backups (via filter)' })
   async findBackups(
     @GraphQLServiceOptions() serviceOptions: ServiceOptions,
     @Args() args?: FilterArgs
   ) {
     return await this.backupService.find(args, {
       ...serviceOptions,
       inputType: FilterArgs
     });
   }

  /**
   * Get Backup via ID
   */
  @Roles(RoleEnum.ADMIN)
  @Query(() => Backup, { description: 'Get Backup with specified ID' })
  async getBackup(
    @GraphQLServiceOptions() serviceOptions: ServiceOptions,
    @Args('id') id: string,
  ): Promise<Backup> {
    return await this.backupService.get(id, serviceOptions);
  }

  @Roles(RoleEnum.ADMIN)
  @Query(() => Backup, { description: 'Get Backup with specified container ID' })
  async getBackupByDatabase(
    @GraphQLServiceOptions() serviceOptions: ServiceOptions,
    @Args('containerId') containerId: string,
  ): Promise<Backup | null> {
    const result = await this.backupService.find({filterQuery: {container: getStringIds(containerId)}}, serviceOptions);

    if (!result?.length) {
      return null;
    }

    return result[0];
  }

  @Roles(RoleEnum.ADMIN)
  @Query(() => [S3BackupListOutput], { description: 'Get Backup with specified container ID' })
  async listBackups(
    @GraphQLServiceOptions() serviceOptions: ServiceOptions,
    @Args('containerId') containerId: string,
  ): Promise<{label: string; key: string}[]> {
    return await this.backupService.listBackups(containerId, serviceOptions);
  }

  // ===========================================================================
  // Mutations
  // ===========================================================================

  /**
   * Create new Backup
   */
  @Roles(RoleEnum.ADMIN)
  @Mutation(() => Backup, { description: 'Create a new Backup' })
  async createBackup(
    @GraphQLServiceOptions() serviceOptions: ServiceOptions,
    @Args('input') input: BackupCreateInput
  ): Promise<Backup> {
    return await this.backupService.create(input, {
      ...serviceOptions,
      inputType: BackupCreateInput
    });
  }

  /**
   * Delete existing Backup
   */
  @Roles(RoleEnum.ADMIN)
  @Mutation(() => Backup, { description: 'Delete existing Backup' })
  async deleteBackup(
    @GraphQLServiceOptions() serviceOptions: ServiceOptions,
    @Args('id') id: string
  ): Promise<Backup> {
    return await this.backupService.delete(id, {
      ...serviceOptions,
      roles: [RoleEnum.ADMIN, RoleEnum.S_CREATOR]
    });
  }

  @Roles(RoleEnum.ADMIN)
  @Mutation(() => Boolean, { description: 'Restore Backup' })
  async restoreBackup(
    @Args('containerId') containerId: string,
    @Args('s3Key') s3Key: string
  ): Promise<boolean> {
    return await this.backupService.restore(containerId, s3Key);
  }

  @Roles(RoleEnum.ADMIN)
  @Mutation(() => Boolean, { description: 'Restore Backup volume' })
  async restoreBackupVolume(
    @Args('containerId') containerId: string,
    @Args('s3Key') s3Key: string
  ): Promise<boolean> {
    return await this.backupService.restoreVolume(containerId, s3Key);
  }

  /**
   * Update existing Backup
   */
  @Roles(RoleEnum.ADMIN)
  @Mutation(() => Backup, { description: 'Update existing Backup' })
  async updateBackup(
    @GraphQLServiceOptions() serviceOptions: ServiceOptions,
    @Args('id') id: string,
    @Args('input') input: BackupInput
  ): Promise<Backup> {
    return await this.backupService.update(id, input, {
      ...serviceOptions,
      inputType: BackupInput,
      roles: [RoleEnum.ADMIN, RoleEnum.S_CREATOR]
    });
  }
}
