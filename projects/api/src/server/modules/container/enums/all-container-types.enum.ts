import {registerEnumType} from '@nestjs/graphql';

export enum AllContainerTypes {
  ADMINER = 'ADMINER',
  CLICKHOUSE_UI = 'CLICKHOUSE_UI',
  CUSTOM = 'CUSTOM',
  DIRECTUS = 'DIRECTUS',
  MARIA_DB = 'MARIA_DB',
  MONGO = 'MONGO',
  MONGO_EXPRESS = 'MONGO_EXPRESS',
  NODE = 'NODE',
  PLAUSIBLE = 'PLAUSIBLE',
  REDIS_UI = 'REDIS_UI',
  ROCKET_ADMIN = 'ROCKET_ADMIN',
  STATIC = 'STATIC',
}

registerEnumType(AllContainerTypes, {
  name: 'AllContainerTypes',
  description: 'All Types of Container',
});
