import {CoreUserCreateInput, Restricted, RoleEnum} from '@lenne.tech/nest-server';
import {Field, InputType} from '@nestjs/graphql';

/**
 * User input to create a new user
 */
@InputType({ description: 'User input to create a new user' })
export class UserCreateInput extends CoreUserCreateInput {
  // Extend UserCreateInput here
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'id of Team',
    nullable: true,
  })
  team?: string = undefined;
}
