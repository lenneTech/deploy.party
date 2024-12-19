import { Field, ObjectType } from '@nestjs/graphql';
import { Container } from '../container.model';

@ObjectType({ description: 'Result of find and count Containers' })
export class FindAndCountContainersResult {
  @Field(() => [Container], { description: 'Found Containers' })
  items: Container[];

  @Field({ description: 'Total count (skip/offset and limit/take are ignored in the count)' })
  totalCount: number;
}
