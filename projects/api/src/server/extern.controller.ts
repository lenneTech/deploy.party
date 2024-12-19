import {Body, Controller, Delete, Get, Headers, Param, Post} from "@nestjs/common";
import {BuildService} from "./modules/build/build.service";
import {ContainerService} from "./modules/container/container.service";
import {ManuallyDeployDto} from "./common/dto/manually-deploy.dto";
import {ContainerStatus} from "./modules/container/enums/container-status.enum";
import {ApiKeyService} from "./modules/api-key/api-key.service";
import {DeploymentType} from "./modules/container/enums/deployment-type.enum";
import {CallbackInput} from "./common/dto/callback.input";
import {BackupService} from "./modules/backup/backup.service";
import {AutoBackupDto} from "./common/dto/auto-backup.dto";
import {ContainerKind} from "./modules/container/enums/container-kind.enum";
import {ApiBody, ApiOperation, ApiParam, ApiResponse} from "@nestjs/swagger";
import {Backup} from "./modules/backup/backup.model";
import {BackupInput} from "./modules/backup/inputs/backup.input";

@Controller('extern')
export class ExternController {
  constructor(
    protected buildService: BuildService,
    private containerService: ContainerService,
    private apiKeyService: ApiKeyService,
    private backupService: BackupService,
  ) {}

  @Post(':projectId/deploy')
  @ApiOperation({
    summary: 'Manually deploy a project',
    description: 'Manually deploy a project by providing the project ID, deployment type, target version and optional callback URL',
  })
  @ApiBody({
    type: ManuallyDeployDto,
    description: 'Manually deploy a project by providing the project ID, deployment type, target version and optional callback URL',
  })
  @ApiResponse({
    type: Boolean,
    status: 200,
    description: 'Deployment triggered successfully',
  })
  async manuallyDeploy(@Headers('dp-api-token') apiToken: string, @Param('projectId') projectId: string, @Body() input: ManuallyDeployDto) {
    if (!apiToken) {
      return 'No API Token provided';
    }

    const valid = await this.apiKeyService.checkTokenIsValid(apiToken);
    if (!valid) {
      return 'Invalid API Token';
    }

    const containers = await this.containerService.findContainersForProject(projectId);

    // loop through containers
    for (const container of containers) {
      if (container.kind === ContainerKind.DATABASE) {
        continue;
      }

      // check if container is draft, stopped or stopped by system and skip
      if (container.status === ContainerStatus.STOPPED ||
        container.status === ContainerStatus.DRAFT ||
        container.status === ContainerStatus.STOPPED_BY_SYSTEM) {
        continue;
      }

      // create build (queue handler will start build)
      await this.buildService.create({
        container: container.id,
        callbackUrl: input.callbackUrl,
        targetVersion: input.targetVersion,
        deploymentType: input.deploymentType,
        currentVersion: input.deploymentType === DeploymentType.BRANCH ? container.branch : container.tag,
      });
    }

    return true;
  }

  @Post(':projectId/backup/auto')
  @ApiOperation({
    summary: 'Activate or deactivate auto backup',
    description: 'Activate or deactivate auto backup for a project',
  })
  @ApiBody({
    type: AutoBackupDto,
    description: 'Activate or deactivate auto backup for a project',
  })
  @ApiParam({ name: 'projectId', type: 'string' })
  @ApiResponse({
    type: Backup,
    status: 200,
    description: 'Auto backup activated or deactivated',
  })
  async autoBackup(@Headers('dp-api-token') apiToken: string, @Param('projectId') projectId: string, @Body() input: AutoBackupDto) {
    if (!apiToken) {
      return 'No API Token provided';
    }

    const valid = await this.apiKeyService.checkTokenIsValid(apiToken);
    if (!valid) {
      return 'Invalid API Token';
    }

    const containers = await this.containerService.findContainersForProject(projectId);
    const dbContainer = containers.find((container) => container.kind === ContainerKind.DATABASE);
    if (!dbContainer) {
      throw new Error('No database container found');
    }

    const backup = await this.backupService.getByContainer(dbContainer.id);
    if (!backup) {
      throw new Error('No backup config found');
    }

    return await this.backupService.updateForce(backup.id, { active: input.enableAutoBackup } as BackupInput);
  }

  @Post(':projectId/backup/create')
  @ApiOperation({
    summary: 'Create a backup',
    description: 'Create a backup for a project by providing the project ID and backup name',
  })
  @ApiParam({ name: 'projectId', type: 'string' })
  @ApiResponse({
    type: Backup,
    status: 200,
    description: 'Backup created successfully',
  })
  async createBackup(@Headers('dp-api-token') apiToken: string, @Param('projectId') projectId: string, @Body() input: CallbackInput) {
    if (!apiToken) {
      return 'No API Token provided';
    }

    const valid = await this.apiKeyService.checkTokenIsValid(apiToken);
    if (!valid) {
      return 'Invalid API Token';
    }

    const containers = await this.containerService.findContainersForProject(projectId);
    const dbContainer = containers.find((container) => container.kind === ContainerKind.DATABASE);
    if (!dbContainer) {
      throw new Error('No database container found');
    }

    const backup = await this.backupService.getByContainer(dbContainer.id);
    if (!backup) {
      throw new Error('No backup config found');
    }

    return await this.backupService.backup(backup, input);
  }

  @Post(':projectId/backup/:backupKey/restore')
  @ApiOperation({
    summary: 'Restore a backup',
    description: 'Restore a backup for a project by providing the project ID and backup key',
  })
  @ApiParam({ name: 'projectId', type: 'string' })
  @ApiParam({ name: 'backupKey', type: 'string' })
  @ApiResponse({
    type: Boolean,
    status: 200,
    description: 'Backup restored successfully',
  })
  async restoreBackup(@Headers('dp-api-token') apiToken: string, @Param('projectId') projectId: string, @Param('backupKey') backupKey: string, @Body() input: CallbackInput) {
    if (!apiToken) {
      return 'No API Token provided';
    }

    const valid = await this.apiKeyService.checkTokenIsValid(apiToken);
    if (!valid) {
      return 'Invalid API Token';
    }

    const containers = await this.containerService.findContainersForProject(projectId);
    const dbContainer = containers.find((container) => container.kind === ContainerKind.DATABASE);
    if (!dbContainer) {
      throw new Error('No database container found');
    }

    const backup = await this.backupService.getByContainer(dbContainer.id);
    if (!backup) {
      throw new Error('No backup config found');
    }

    return await this.backupService.restore(dbContainer.id, backupKey, input);
  }

  @Delete(':projectId/backup/:backupKey/delete')
  @ApiOperation({
    summary: 'Delete a backup',
    description: 'Delete a backup for a project by providing the project ID and backup key',
  })
  @ApiParam({ name: 'projectId', type: 'string' })
  @ApiParam({ name: 'backupKey', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Backup deleted successfully',
  })
  async deleteBackup(@Headers('dp-api-token') apiToken: string, @Param('projectId') projectId: string, @Param('backupKey') backupKey: string) {
    if (!apiToken) {
      return 'No API Token provided';
    }

    const valid = await this.apiKeyService.checkTokenIsValid(apiToken);
    if (!valid) {
      return 'Invalid API Token';
    }

    const containers = await this.containerService.findContainersForProject(projectId);
    const dbContainer = containers.find((container) => container.kind === ContainerKind.DATABASE);
    if (!dbContainer) {
      throw new Error('No database container found');
    }

    const backup = await this.backupService.getByContainer(dbContainer.id);
    if (!backup) {
      throw new Error('No backup config found');
    }

    // delete backup by key
    return this.backupService.deleteBackupInS3(dbContainer.id, backupKey);
  }

  @Get(':projectId/backups')
  @ApiOperation({
    summary: 'Get all backups',
    description: 'Get all backups for a project by providing the project ID from s3 storage',
  })
  @ApiParam({ name: 'projectId', type: 'string' })
  async getBackups(@Headers('dp-api-token') apiToken: string, @Param('projectId') projectId: string) {
    if (!apiToken) {
      return 'No API Token provided';
    }

    const valid = await this.apiKeyService.checkTokenIsValid(apiToken);
    if (!valid) {
      return 'Invalid API Token';
    }

    const containers = await this.containerService.findContainersForProject(projectId);
    const dbContainer = containers.find((container) => container.kind === ContainerKind.DATABASE);
    if (!dbContainer) {
      throw new Error('No database container found');
    }

    return await this.backupService.listBackups(dbContainer.id, {force: true});
  }
}
