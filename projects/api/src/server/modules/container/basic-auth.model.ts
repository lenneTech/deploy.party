import { Field, ObjectType } from '@nestjs/graphql';
import { Prop } from '@nestjs/mongoose';

@ObjectType({
  description: 'Address Object that references the location',
})
export class BasicAuth {
  @Field(() => String, {
    description: 'username of BasicAuth',
    nullable: true,
  })
  @Prop({ type: String, index: true })
  username?: string = undefined;

  @Field(() => String, {
    description: 'password of BasicAuth',
    nullable: true,
  })
  @Prop({ type: String, index: true })
  pw?: string = undefined;
}
