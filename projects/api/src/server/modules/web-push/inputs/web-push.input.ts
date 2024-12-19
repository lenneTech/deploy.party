import { CoreInput, Restricted, RoleEnum } from '@lenne.tech/nest-server';
import { Field, InputType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';

/**
 * WebPush input
 */
@Restricted(RoleEnum.ADMIN)
@InputType({ description: 'Input data to update an existing WebPush' })
export class WebPushInput extends CoreInput {

  // ===================================================================================================================
  // Properties
  // ===================================================================================================================
      
  /**
   * Subscription of WebPush
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Subscription of WebPush',
    nullable: true,
  })
  @IsOptional()
  subscription?: string = undefined;
      
  /**
   * UserId of WebPush
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'UserId of WebPush',
    nullable: true,
  })
  @IsOptional()
  user?: string = undefined;
  
}
