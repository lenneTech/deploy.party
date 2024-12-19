import { CoreUserInput, Restricted, RoleEnum } from '@lenne.tech/nest-server';
import { Field, InputType } from '@nestjs/graphql';

/**
 * User input to update a user
 */
@InputType({ description: 'User input' })
export class UserInput extends CoreUserInput {
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'id of Team',
    nullable: true,
  })
  team: string = undefined;
}
