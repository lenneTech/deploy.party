import { Field, ObjectType } from '@nestjs/graphql';
import { Backup } from '../backup.model';

@ObjectType({ description: 'Result of find and count Backups' })
export class FindAndCountBackupsResult {
  @Field(() => [Backup], { description: 'Found Backups' })
  items: Backup[];

  @Field({ description: 'Total count (skip/offset and limit/take are ignored in the count)' })
  totalCount: number;
}
