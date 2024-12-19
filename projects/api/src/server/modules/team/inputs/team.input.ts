import {Restricted, RoleEnum} from '@lenne.tech/nest-server';
import {Field, InputType} from '@nestjs/graphql';
import {IsOptional} from 'class-validator';

/**
 * Team input
 */
@Restricted(RoleEnum.ADMIN)
@InputType({description: 'Input data to update an existing Team'})
export class TeamInput {
  // ===================================================================================================================
  // Properties
  // ===================================================================================================================

  /**
   * Name of Team
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Name of Team',
    nullable: true,
  })
  @IsOptional()
  name?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Boolean, {
    description: 'maintenance mode of Team',
    nullable: true,
  })
  @IsOptional()
  maintenance?: boolean = undefined;

  /**
   * Projects of Team
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => [String], {
    description: 'Projects of Team',
    nullable: true,
  })
  @IsOptional()
  projects?: string[] = undefined;

  /**
   * Registries of Team
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => [String], {
    description: 'Registries of Team',
    nullable: true,
  })
  @IsOptional()
  registries?: string[] = undefined;
}
