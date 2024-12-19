import {Field, ObjectType} from '@nestjs/graphql';
import {DockerContainer} from "./docker-container.output";

@ObjectType({ description: 'Stats of system' })
export class SystemStats {
  @Field(() => Number, { description: 'memory in gb' })
  memory: number;

  @Field(() => Number, { description: 'memory in gb' })
  totalMemory: number;

  @Field(() => Number, { description: 'cpu in prozent' })
  cpu: number;

  @Field(() => String, { description: 'uptime' })
  uptime: string;

  @Field(() => [DockerContainer], { description: 'docker containers' })
  containers: DockerContainer[];
}
