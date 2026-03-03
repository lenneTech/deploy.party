import { MigrationContainerDto, MigrationContainerDetailDto } from './migration-container.dto';

export class MigrationProjectDto {
  id: string;
  name: string;
  identifier: string;
  containers: MigrationContainerDto[];
}

export class MigrationProjectDetailDto {
  id: string;
  name: string;
  identifier: string;
  containers: MigrationContainerDetailDto[];
}
