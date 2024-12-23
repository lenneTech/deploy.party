import {registerEnumType} from "@nestjs/graphql";

export enum BackupStatus {
  STARTED = 'STARTED',
  FAILED = 'FAILED',
  SUCCEEDED = 'SUCCEEDED',
}

registerEnumType(BackupStatus, {
  name: 'BackupStatus',
  description: 'Status of Backup',
});
