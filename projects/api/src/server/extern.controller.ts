import { Body, Controller, Delete, Get, Headers, Param, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from "@nestjs/swagger";
import { AutoBackupDto } from "./common/dto/auto-backup.dto";
import { CallbackInput } from "./common/dto/callback.input";
import { ManuallyDeployDto } from "./common/dto/manually-deploy.dto";
import { DockerService } from "./common/services/docker.service";
import { ApiKeyService } from "./modules/api-key/api-key.service";
import { BackupService } from "./modules/backup/backup.service";
import { BackupStatus } from "./modules/backup/enum/backup-status.enum";
import { BackupInput } from "./modules/backup/inputs/backup.input";
import { BuildService } from "./modules/build/build.service";
import { BackupExternResult } from "./modules/build/outputs/backup-extern.result";
import { Container } from "./modules/container/container.model";
import { ContainerService } from "./modules/container/container.service";
import { ContainerKind } from "./modules/container/enums/container-kind.enum";
import { ContainerStatus } from "./modules/container/enums/container-status.enum";
import { DeploymentType } from "./modules/container/enums/deployment-type.enum";

@Controller('extern')
export class ExternController {
  constructor(
    protected buildService: BuildService,
    private containerService: ContainerService,
    private apiKeyService: ApiKeyService,
    private backupService: BackupService,
    private dockerService: DockerService,
  ) { }

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
      }, {
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
    type: Boolean,
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

    let backup = await this.backupService.getByContainer(dbContainer.id);
    if (!backup) {
      throw new Error('No backup config found');
    }

    if (backup.active === input.enableAutoBackup) {
      return !!backup.active;
    }

    backup = await this.backupService.updateForce(backup.id, { active: input.enableAutoBackup } as BackupInput);
    return !!backup.active;
  }

  @Post(':projectId/backup/create')
  @ApiOperation({
    summary: 'Create a backup',
    description: 'Create a backup for a project by providing the project ID and backup name',
  })
  @ApiParam({ name: 'projectId', type: 'string' })
  @ApiResponse({
    type: BackupExternResult,
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

    await this.backupService.backup(backup, input);

    return {
      status: BackupStatus.STARTED,
    };
  }

  @Post(':projectId/backup/restore')
  @ApiOperation({
    summary: 'Restore a backup',
    description: 'Restore a backup for a project by providing the project ID and backup key',
  })
  @ApiParam({ name: 'projectId', type: 'string' })
  @ApiResponse({
    type: BackupExternResult,
    status: 200,
    description: 'Backup restored successfully',
  })
  async restoreBackup(@Headers('dp-api-token') apiToken: string, @Param('projectId') projectId: string, @Body() input: CallbackInput) {
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

    await this.backupService.restore(dbContainer.id, input.backupKey, input);

    return {
      status: BackupStatus.STARTED,
      key: input.backupKey,
    }
  }

  @Delete(':projectId/backup/delete')
  @ApiOperation({
    summary: 'Delete a backup',
    description: 'Delete a backup for a project by providing the project ID and backup key',
  })
  @ApiParam({ name: 'projectId', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Backup deleted successfully',
  })
  async deleteBackup(@Headers('dp-api-token') apiToken: string, @Param('projectId') projectId: string, @Body() input: CallbackInput) {
    console.debug('deleteBackup', input);
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

    console.debug('deleteBackup::container_id', dbContainer.id);

    const backup = await this.backupService.getByContainer(dbContainer.id);
    if (!backup) {
      throw new Error('No backup config found');
    }

    // delete backup by key
    return await this.backupService.deleteBackupInS3(dbContainer.id, input.backupKey);
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

    return await this.backupService.listBackups(dbContainer.id, { force: true });
  }

  @Post('migrate/traefik-middleware')
  @ApiOperation({
    summary: 'Migrate Traefik middleware configuration',
    description: 'Updates all deployed containers to use Traefik v3/v4 middleware syntax with @swarm provider suffix. Performs rolling update to minimize downtime.',
  })
  @ApiResponse({
    status: 200,
    description: 'Migration completed with details about success and failures',
  })
  async migrateTraefikMiddleware(@Headers('dp-api-token') apiToken: string) {
    if (!apiToken) {
      return 'No API Token provided';
    }

    const valid = await this.apiKeyService.checkTokenIsValid(apiToken);
    if (!valid) {
      return 'Invalid API Token';
    }

    const allDeployed = await this.containerService.findForce({ filterQuery: { status: ContainerStatus.DEPLOYED } });

    // Filter out database containers (they don't use Traefik)
    const deployedContainers = allDeployed.filter(
      (c: Container) => c.kind !== ContainerKind.DATABASE
    );

    const result = {
      success: true,
      total: deployedContainers.length,
      migrated: 0,
      failed: 0,
      details: [],
    };

    console.debug(`Starting Traefik middleware migration for ${deployedContainers.length} containers...`);

    for (const container of deployedContainers) {
      try {
        console.debug(`Migrating container ${container.id} (${container.name})...`);

        await this.dockerService.stop(container);
        await this.dockerService.createDockerComposeFile(container);
        await this.dockerService.deploy(container);

        result.migrated++;
        result.details.push({
          containerId: container.id,
          name: container.name,
          status: 'success',
        });

        console.debug(`✓ Successfully migrated container ${container.id}`);
      } catch (error) {
        result.failed++;
        result.success = false;
        result.details.push({
          containerId: container.id,
          name: container.name,
          status: 'failed',
          error: error.message,
        });

        console.error(`✗ Failed to migrate container ${container.id}:`, error.message);
      }
    }

    console.debug(`Migration completed: ${result.migrated} succeeded, ${result.failed} failed`);

    return result;
  }
}
