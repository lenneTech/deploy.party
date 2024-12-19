import {Restricted, RoleEnum} from '@lenne.tech/nest-server';
import {Field, InputType} from '@nestjs/graphql';
import {IsOptional} from 'class-validator';


/**
 * ApiKey create input
 */
@Restricted(RoleEnum.ADMIN)
@InputType({ description: 'Input data to create a new ApiKey' })
export class ApiKeyCreateInput {

  // ===================================================================================================================
  // Properties
  // ===================================================================================================================

  /**
   * Name of ApiKey
   */
  @Restricted(RoleEnum.ADMIN)
  @Field(() => String, {
    description: 'Name of ApiKey',
  })
  name: string = undefined;

  /**
   * ExpiredAt of ApiKey
   */
  @Restricted(RoleEnum.ADMIN)
  @Field(() => Number, {
    description: 'ExpiredAt of ApiKey',
    nullable: true,
  })
  @IsOptional()
  expiredAt?: Date = undefined;
}
