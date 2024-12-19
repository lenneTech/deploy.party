import { registerEnumType } from '@nestjs/graphql';

export enum DatabaseType {
  MONGO = 'MONGO',
  MARIA_DB = 'MARIA_DB',
}

registerEnumType(DatabaseType, {
  name: 'DatabaseType',
  description: 'Database Type of Container',
});
