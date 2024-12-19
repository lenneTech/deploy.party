import { Restricted, RoleEnum } from '@lenne.tech/nest-server';
import { Field, InputType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';
import { WebPushInput } from './web-push.input';


/**
 * WebPush create input
 */
@Restricted(RoleEnum.ADMIN)
@InputType({ description: 'Input data to create a new WebPush' })
export class WebPushCreateInput extends WebPushInput {

  // ===================================================================================================================
  // Properties
  // ===================================================================================================================

  /**
   * Subscription of WebPush
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Subscription of WebPush',
    nullable: false,
  })
  override subscription: string = undefined;

  /**
   * UserId of WebPush
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'UserId of WebPush',
    nullable: false,
  })
  override user: string = undefined;
}
