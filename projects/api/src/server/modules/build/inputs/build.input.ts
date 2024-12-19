import { Restricted, RoleEnum } from '@lenne.tech/nest-server';
import { Field, InputType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';
import { BuildStatus } from '../enums/build-status.enum';

/**
 * Build input
 */
@Restricted(RoleEnum.ADMIN)
@InputType({ description: 'Input data to update an existing Build' })
export class BuildInput {
  // ===================================================================================================================
  // Properties
  // ===================================================================================================================

  /**
   * Container of Build
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Container of Build',
    nullable: true,
  })
  @IsOptional()
  container: string = undefined;

  /**
   * Log of Build
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => [String], {
    description: 'Log of Build',
    nullable: true,
  })
  @IsOptional()
  log?: string[] = undefined;

  /**
   * Status of Build
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => BuildStatus, {
    description: 'Status of Build',
    nullable: true,
  })
  @IsOptional()
  status?: BuildStatus = undefined;

  @IsOptional()
  restarted?: boolean = undefined;
}
