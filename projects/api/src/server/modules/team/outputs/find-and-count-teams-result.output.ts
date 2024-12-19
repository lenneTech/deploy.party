import { Field, ObjectType } from '@nestjs/graphql';
import { Team } from '../team.model';

@ObjectType({ description: 'Result of find and count Teams' })
export class FindAndCountTeamsResult {
  @Field(() => [Team], { description: 'Found Teams' })
  items: Team[];

  @Field({ description: 'Total count (skip/offset and limit/take are ignored in the count)' })
  totalCount: number;
}
