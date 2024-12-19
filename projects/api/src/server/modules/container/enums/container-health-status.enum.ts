import {registerEnumType} from '@nestjs/graphql';

export enum ContainerHealthStatus {
  HEALTHY = 'HEALTHY',
  STARTING = 'STARTING',
  IDLE = 'IDLE',
  UNHEALTHY = 'UNHEALTHY',
}

registerEnumType(ContainerHealthStatus, {
  name: 'ContainerHealthStatus',
  description: 'Health status of Container',
});
