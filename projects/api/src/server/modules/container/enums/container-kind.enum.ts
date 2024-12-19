import { registerEnumType } from '@nestjs/graphql';

export enum ContainerKind {
  APPLICATION = 'APPLICATION',
  DATABASE = 'DATABASE',
  SERVICE = 'SERVICE',
  CUSTOM = 'CUSTOM',
}

registerEnumType(ContainerKind, {
  name: 'ContainerKind',
  description: 'Kind of Container',
});
