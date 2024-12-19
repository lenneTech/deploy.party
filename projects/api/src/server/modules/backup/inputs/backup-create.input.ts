import {Restricted, RoleEnum} from '@lenne.tech/nest-server';
import {Field, InputType} from '@nestjs/graphql';
import {IsOptional} from 'class-validator';
import {BackupInput} from './backup.input';


/**
 * Backup create input
 */
@Restricted(RoleEnum.ADMIN)
@InputType({ description: 'Input data to create a new Backup' })
export class BackupCreateInput extends BackupInput {

  // ===================================================================================================================
  // Properties
  // ===================================================================================================================

  /**
   * Active of Backup
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Boolean, {
    description: 'Active of Backup',
    nullable: false,
  })
  override active: boolean = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'path of Backup',
    nullable: true,
  })
  @IsOptional()
  override path?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Container for Backup',
    nullable: false,
  })
  container: string = undefined;

  /**
   * CronExpression of Backup
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'CronExpression of Backup',
    nullable: true,
  })
  @IsOptional()
  override cronExpression?: string = undefined;

  /**
   * Host of Backup
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Host of Backup',
    nullable: true,
  })
  @IsOptional()
  override host?: string = undefined;

  /**
   * Key of Backup
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Key of Backup',
    nullable: true,
  })
  @IsOptional()
  override key?: string = undefined;

  /**
   * Secret of Backup
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Secret of Backup',
    nullable: true,
  })
  @IsOptional()
  override secret?: string = undefined;

  /**
   * Region of Backup
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Region of Backup',
    nullable: true,
  })
  @IsOptional()
  override region?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Bucket of Backup',
    nullable: true,
  })
  @IsOptional()
  override bucket?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Number, {
    description: 'Max count of Backups',
    nullable: true,
  })
  @IsOptional()
  override maxBackups?: number = undefined;
}
