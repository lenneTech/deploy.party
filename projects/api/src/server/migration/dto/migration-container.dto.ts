import { MigrationRegistryDto } from './migration-registry.dto';
import { MigrationSourceDto } from './migration-source.dto';
import { ContainerVolume } from '../../modules/container/container-volume.model';

export class MigrationContainerDto {
  id: string;
  name: string;
  kind: string;
  type: string;
  status: string;
  url?: string;
  branch?: string;
  deploymentType: string;
}

export class MigrationContainerDetailDto extends MigrationContainerDto {
  tag?: string;
  port?: string;
  ssl?: boolean;
  www?: boolean;
  buildImage?: string;
  buildCmd?: string;
  installCmd?: string;
  startCmd?: string;
  healthCheckCmd?: string;
  maxMemory?: number;
  baseDir?: string;
  repositoryUrl?: string;
  volumes?: ContainerVolume[];
  additionalNetworks?: string[];
  registry?: MigrationRegistryDto | null;
  source?: MigrationSourceDto | null;
  env?: string;
}
