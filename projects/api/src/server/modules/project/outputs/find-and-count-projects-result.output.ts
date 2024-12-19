import { Field, ObjectType } from '@nestjs/graphql';
import { Project } from '../project.model';

@ObjectType({ description: 'Result of find and count Projects' })
export class FindAndCountProjectsResult {
  @Field(() => [Project], { description: 'Found Projects' })
  items: Project[];

  @Field({ description: 'Total count (skip/offset and limit/take are ignored in the count)' })
  totalCount: number;
}
