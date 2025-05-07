import {registerEnumType} from '@nestjs/graphql';

export enum AllContainerTypes {
  NODE = 'NODE',
  STATIC = 'STATIC',
  MONGO = 'MONGO',
  MARIA_DB = 'MARIA_DB',
  DIRECTUS = 'DIRECTUS',
  ADMINER = 'ADMINER',
  ROCKET_ADMIN = 'ROCKET_ADMIN',
  CUSTOM = 'CUSTOM',
}

registerEnumType(AllContainerTypes, {
  name: 'AllContainerTypes',
  description: 'All Types of Container',
});
