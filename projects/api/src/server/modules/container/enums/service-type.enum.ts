import {registerEnumType} from '@nestjs/graphql';

export enum ServiceType {
  DIRECTUS = 'DIRECTUS',
  ROCKET_ADMIN = 'ROCKET_ADMIN',
  MONGO_EXPRESS = 'MONGO_EXPRESS',
  REDIS_UI = 'REDIS_UI',
  ADMINER = 'ADMINER',
  CUSTOM = 'CUSTOM',
}

registerEnumType(ServiceType, {
  name: 'ServiceType',
  description: 'Service Type of Container',
});

