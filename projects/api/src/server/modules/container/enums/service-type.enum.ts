import {registerEnumType} from '@nestjs/graphql';

export enum ServiceType {
  ADMINER = 'ADMINER',
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

