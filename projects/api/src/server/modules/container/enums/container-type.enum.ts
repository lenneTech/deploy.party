import {registerEnumType} from '@nestjs/graphql';

export enum ContainerType {
  NODE = 'NODE',
  STATIC = 'STATIC',
  CUSTOM = 'CUSTOM',
}

registerEnumType(ContainerType, {
  name: 'ContainerType',
  description: 'Type of Container',
});
