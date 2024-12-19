import { CoreInput, Restricted, RoleEnum } from '@lenne.tech/nest-server';
import { Field, InputType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';
import {BackupType} from "../enum/backup-type.enum";

/**
 * Backup input
 */
@Restricted(RoleEnum.ADMIN)
@InputType({ description: 'Input data to update an existing Backup' })
export class BackupInput extends CoreInput {

  // ===================================================================================================================
  // Properties
  // ===================================================================================================================

  /**
   * Active of Backup
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Boolean, {
    description: 'Active of Backup',
    nullable: true,
  })
  @IsOptional()
  active?: boolean = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'path of Backup',
    nullable: true,
  })
  @IsOptional()
  path?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => [String], {
    description: 'Log of last Backup',
    nullable: true,
  })
  @IsOptional()
  log?: string[] = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => [String], {
    description: 'restoreLog of last Backup',
    nullable: true,
  })
  @IsOptional()
  restoreLog?: string[] = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Date, {
    description: 'Date of last Backup',
    nullable: true,
  })
  @IsOptional()
  lastBuild?: Date = undefined;

  /**
   * CronExpression of Backup
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'CronExpression of Backup',
    nullable: true,
  })
  @IsOptional()
  cronExpression?: string = undefined;

  /**
   * Host of Backup
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Host of Backup',
    nullable: true,
  })
  @IsOptional()
  host?: string = undefined;

  /**
   * Key of Backup
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Key of Backup',
    nullable: true,
  })
  @IsOptional()
  key?: string = undefined;

  /**
   * Secret of Backup
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Secret of Backup',
    nullable: true,
  })
  @IsOptional()
  secret?: string = undefined;

  /**
   * Region of Backup
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Region of Backup',
    nullable: true,
  })
  @IsOptional()
  region?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Bucket of Backup',
    nullable: true,
  })
  @IsOptional()
  bucket?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Number, {
    description: 'Max count of Backups',
    nullable: true,
  })
  @IsOptional()
  maxBackups?: number = undefined;
}
