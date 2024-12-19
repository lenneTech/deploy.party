import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Stats of Containers' })
export class ContainerStats {
  @Field(() => String, { description: 'MemUsage' })
  MemUsage: string;

  @Field(() => String, { description: 'CPUPerc' })
  CPUPerc: string;

  @Field(() => String, { description: 'NetIO' })
  NetIO: string;
}
