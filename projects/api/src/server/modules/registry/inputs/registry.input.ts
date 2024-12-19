import { Restricted, RoleEnum } from '@lenne.tech/nest-server';
import { Field, InputType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';

/**
 * Registry input
 */
@Restricted(RoleEnum.ADMIN)
@InputType({ description: 'Input data to update an existing Registry' })
export class RegistryInput {
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
  name: string = undefined;

  /**
   * Username of Registry
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Username of Registry',
    nullable: true,
  })
  @IsOptional()
  username: string = undefined;

  /**
   * Password of Registry
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Password of Registry',
    nullable: true,
  })
  @IsOptional()
  pw: string = undefined;

  /**
   * Url of Registry
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Url of Registry',
    nullable: true,
  })
  @IsOptional()
  url: string = undefined;
}
