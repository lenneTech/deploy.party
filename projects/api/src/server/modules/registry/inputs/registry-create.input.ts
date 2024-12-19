import { Restricted, RoleEnum } from '@lenne.tech/nest-server';
import { Field, InputType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';
import { RegistryInput } from './registry.input';


/**
 * Registry create input
 */
@Restricted(RoleEnum.ADMIN)
@InputType({ description: 'Input data to create a new Registry' })
export class RegistryCreateInput extends RegistryInput {
  // ===================================================================================================================
  // Properties
  // ===================================================================================================================

  /**
   * Name of Registry
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Name of Registry',
    nullable: true,
  })
  @IsOptional()
  override name: string = undefined;

  /**
   * Username of Registry
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Username of Registry',
    nullable: false,
  })
  override username: string = undefined;

  /**
   * Password of Registry
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Password of Registry',
    nullable: false,
  })
  override pw: string = undefined;

  /**
   * Url of Registry
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Url of Registry',
    nullable: false,
  })
  override url: string = undefined;
}
