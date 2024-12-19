import {Field, ObjectType} from '@nestjs/graphql';
import {Source} from '../source.model';

@ObjectType({ description: 'Result of find and count Sources' })
export class FindAndCountSourcesResult {
  @Field(() => [Source], { description: 'Found Sources' })
  items: Source[];

  @Field({ description: 'Total count (skip/offset and limit/take are ignored in the count)' })
  totalCount: number;
}
