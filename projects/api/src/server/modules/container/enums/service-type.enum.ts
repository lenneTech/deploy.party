import {registerEnumType} from '@nestjs/graphql';

export enum ServiceType {
  DIRECTUS = 'DIRECTUS',
  ROCKET_ADMIN = 'ROCKET_ADMIN',
  ADMINER = 'ADMINER',
  CUSTOM = 'CUSTOM',
}

registerEnumType(ServiceType, {
  name: 'ServiceType',
  description: 'Service Type of Container',
});

