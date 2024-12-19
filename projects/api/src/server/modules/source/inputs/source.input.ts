import {Restricted, RoleEnum} from '@lenne.tech/nest-server';
import {Field, InputType} from '@nestjs/graphql';
import {IsOptional} from 'class-validator';
import {SourceType} from '../enums/source-type.enum';

/**
 * Source input
 */
@Restricted(RoleEnum.ADMIN)
@InputType({ description: 'Input data to update an existing Source' })
export class SourceInput {
  // ===================================================================================================================
  // Properties
  // ===================================================================================================================

  /**
   * Name of Source
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Name of Source',
    nullable: true,
  })
  @IsOptional()
  name: string = undefined;

  /**
   * Type of Source
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => SourceType, {
    description: 'Type of Source',
    nullable: true,
  })
  @IsOptional()
  type: SourceType = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'URL of Source',
    nullable: true,
  })
  url?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Token of Source',
    nullable: true,
  })
  token?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Team of Source',
    nullable: true,
  })
  team: string = undefined;
}
