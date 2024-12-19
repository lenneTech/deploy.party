import {Field, ObjectType} from '@nestjs/graphql';

@ObjectType({ description: 'docker container with stats' })
export class DockerContainer {
  @Field(() => String, { description: 'id' })
  id: string;

  @Field(() => String, { description: 'name' })
  name: string;

  @Field(() => String, { description: 'memPercent' })
  memPercent: string;

  @Field(() => String, { description: 'cpuPercent' })
  cpuPercent: string;

  @Field(() => String, { description: 'state' })
  state: string;

  @Field(() => String, { description: 'started' })
  started: string;

  @Field(() => String, { description: 'restartCount' })
  restartCount: string;
}
