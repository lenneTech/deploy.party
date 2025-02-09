import {Restricted, RoleEnum} from '@lenne.tech/nest-server';
import {Field, InputType} from '@nestjs/graphql';
import {IsOptional} from 'class-validator';
import {BuildStatus} from '../enums/build-status.enum';
import {BuildInput} from './build.input';

/**
 * Build create input
 */
@Restricted(RoleEnum.ADMIN)
@InputType({ description: 'Input data to create a new Build' })
export class BuildCreateInput extends BuildInput {
  // ===================================================================================================================
  // Properties
  // ===================================================================================================================

  /**
   * Container of Build
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Container of Build',
    nullable: false,
  })
  override container: string = undefined;

  /**
   * Log of Build
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => [String], {
    description: 'Log of Build',
    nullable: true,
  })
  @IsOptional()
  override log?: string[] = undefined;

  /**
   * Status of Build
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => BuildStatus, {
    description: 'Status of Build',
    nullable: true,
  })
  @IsOptional()
  override status?: BuildStatus = undefined;
}
