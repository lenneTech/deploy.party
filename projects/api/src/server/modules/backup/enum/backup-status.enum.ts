import {registerEnumType} from "@nestjs/graphql";

export enum BackupStatus {
  STARTED = 'STARTED',
  FAILED = 'FAILED',
  SUCCEDDED = 'SUCCEDDED',
}

registerEnumType(BackupStatus, {
  name: 'BackupStatus',
  description: 'Status of Backup',
});
