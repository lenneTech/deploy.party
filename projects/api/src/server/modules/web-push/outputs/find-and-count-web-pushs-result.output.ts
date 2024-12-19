import { Field, ObjectType } from '@nestjs/graphql';
import { WebPush } from '../web-push.model';

@ObjectType({ description: 'Result of find and count WebPushs' })
export class FindAndCountWebPushsResult {
  @Field(() => [WebPush], { description: 'Found WebPushs' })
  items: WebPush[];

  @Field({ description: 'Total count (skip/offset and limit/take are ignored in the count)' })
  totalCount: number;
}
