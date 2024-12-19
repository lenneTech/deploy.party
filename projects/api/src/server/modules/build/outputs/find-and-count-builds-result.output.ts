import { Field, ObjectType } from '@nestjs/graphql';
import { Build } from '../build.model';

@ObjectType({ description: 'Result of find and count Builds' })
export class FindAndCountBuildsResult {
  @Field(() => [Build], { description: 'Found Builds' })
  items: Build[];

  @Field({ description: 'Total count (skip/offset and limit/take are ignored in the count)' })
  totalCount: number;
}
