export interface ServiceBackupConfig {
  serviceName: string;
  backupTargets: BackupTarget[];
}

export interface BackupTarget {
  containerName: string;
  type: 'DATABASE' | 'VOLUME';
  path?: string;
  dbType?: 'postgresql' | 'mongodb' | 'mariadb';
}

export enum SupportedBackupServices {
  DIRECTUS = 'DIRECTUS',
}

export const SERVICE_BACKUP_CONFIGS: Record<SupportedBackupServices, ServiceBackupConfig> = {
  [SupportedBackupServices.DIRECTUS]: {
    serviceName: 'DIRECTUS',
    backupTargets: [
      {
        containerName: 'database',
        type: 'DATABASE',
        dbType: 'postgresql'
      },
      {
        containerName: 'directus',
        type: 'VOLUME',
        path: '/directus/uploads'
      }
    ]
  }
};
