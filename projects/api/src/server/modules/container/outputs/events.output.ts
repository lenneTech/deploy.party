import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Result of container events' })
export class EventsOutput {
  @Field(() => String, { description: 'log line' })
  log: string;
}
