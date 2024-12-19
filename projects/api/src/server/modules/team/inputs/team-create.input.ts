import {Restricted, RoleEnum} from '@lenne.tech/nest-server';
import {Field, InputType} from '@nestjs/graphql';
import {TeamInput} from './team.input';

/**
 * Team create input
 */
@Restricted(RoleEnum.ADMIN)
@InputType({description: 'Input data to create a new Team'})
export class TeamCreateInput extends TeamInput {

  // ===================================================================================================================
  // Properties
  // ===================================================================================================================

  /**
   * Name of Team
   * not nullable
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Name of Team',
    nullable: false,
  })
  override name: string = undefined;
}
