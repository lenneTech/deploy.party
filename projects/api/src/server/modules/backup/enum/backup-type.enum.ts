import {registerEnumType} from '@nestjs/graphql';

export enum BackupType {
  VOLUME = 'VOLUME',
  DATABASE = 'DATABASE',
}

registerEnumType(BackupType, {
  name: 'BackupType',
  description: 'Type of Backup',
});
