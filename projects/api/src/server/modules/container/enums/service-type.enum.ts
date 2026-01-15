import {registerEnumType} from '@nestjs/graphql';

export enum ServiceType {
  ADMINER = 'ADMINER',
  CHOUSE_UI = 'CHOUSE_UI',
  CLICKHOUSE_UI = 'CLICKHOUSE_UI',
  CUSTOM = 'CUSTOM',
  DIRECTUS = 'DIRECTUS',
  MONGO_EXPRESS = 'MONGO_EXPRESS',
  PLAUSIBLE = 'PLAUSIBLE',
  REDIS_UI = 'REDIS_UI',
  ROCKET_ADMIN = 'ROCKET_ADMIN',
}

registerEnumType(ServiceType, {
  name: 'ServiceType',
  description: 'Service Type of Container',
});

