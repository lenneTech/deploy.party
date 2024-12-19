import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Result of find and count Backups' })
export class S3BackupListOutput {
  @Field( { description: 'Label of Backup' })
  label: string;

  @Field({ description: 'Key of Backup' })
  key: string;
}
