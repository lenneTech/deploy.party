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

    const containers = await this.containerService.findContainersForProject(projectId, { force: true });

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

    const containers = await this.containerService.findContainersForProject(projectId, { force: true });
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
    description: 'Updates all deployed containers to use Traefik v3/v4 middleware syntax with @swarm provider suffix. Performs rolling update to minimize downtime. This operation runs in the background and returns immediately.',
  })
  @ApiResponse({
    status: 200,
    description: 'Migration started successfully. Check server logs for progress.',
  })
  async migrateTraefikMiddleware(@Headers('dp-api-token') apiToken: string) {
    if (!apiToken) {
      return 'No API Token provided';
    }

    const valid = await this.apiKeyService.checkTokenIsValid(apiToken);
    if (!valid) {
      return 'Invalid API Token';
    }

    const allDeployed = await this.containerService.findForce({
      filterQuery: { status: ContainerStatus.DEPLOYED }
    });

    // Filter out database containers (they don't use Traefik)
    const deployedContainerIds = allDeployed
      .filter((c: Container) => c.kind !== ContainerKind.DATABASE)
      .map(c => c.id);

    console.debug(`[Traefik Migration] Starting background migration for ${deployedContainerIds.length} containers...`);

    // Run migration in background (don't await)
    this.runMigrationInBackground(deployedContainerIds).catch(error => {
      console.error('[Traefik Migration] Unexpected error in background migration:', error);
    });

    // Return immediately
    return {
      success: true,
      message: 'Migration started in background',
      total: deployedContainerIds.length,
      note: 'Check server logs for progress. Migration may take several minutes.',
    };
  }

  private async runMigrationInBackground(containerIds: string[]) {
    const result = {
      success: true,
      total: containerIds.length,
      migrated: 0,
      failed: 0,
      details: [],
    };

    for (let i = 0; i < containerIds.length; i++) {
      const containerId = containerIds[i];
      const progress = `[${i + 1}/${containerIds.length}]`;
      let container: Container;

      try {
        // Load container with all relations (registry, source)
        console.debug(`${progress} Loading container ${containerId}...`);
        container = await this.containerService.get(containerId, {
          populate: [{ path: 'registry' }, { path: 'source' }]
        });

        // Check if container exists (could have been deleted during migration)
        if (!container) {
          throw new Error('Container not found or was deleted');
        }

        console.debug(`${progress} Migrating container: ${container.name} (${container.id})`);

        // Check if registry is set (required for APPLICATION containers)
        if (container.kind === ContainerKind.APPLICATION && !container.registry) {
          throw new Error(`Container ${container.name} is missing required registry configuration`);
        }

        // Stop container
        console.debug(`${progress} - Stopping container...`);
        await this.dockerService.stop(container);

        // Regenerate docker-compose with updated middleware syntax
        console.debug(`${progress} - Regenerating docker-compose.yml...`);
        await this.dockerService.createDockerComposeFile(container);

        // Deploy container
        console.debug(`${progress} - Deploying container...`);
        await this.dockerService.deploy(container);

        result.migrated++;
        result.details.push({
          containerId: container.id,
          name: container.name,
          status: 'success',
        });

        console.debug(`${progress} ✓ Successfully migrated: ${container.name}`);

        // Small delay between containers to avoid overwhelming Docker
        if (i < containerIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        result.failed++;
        result.success = false;
        result.details.push({
          containerId: containerId,
          name: container?.name || 'Unknown',
          status: 'failed',
          error: error.message,
          stack: error.stack,
        });

        console.error(`${progress} ✗ Failed to migrate: ${container?.name || containerId}`);
        console.error(`${progress} Error:`, error.message);
        console.error(`${progress} Stack:`, error.stack);

        // Continue with next container even if this one failed
      }
    }

    console.debug(`[Traefik Migration] ========================================`);
    console.debug(`[Traefik Migration] MIGRATION COMPLETED`);
    console.debug(`[Traefik Migration] Total:    ${result.total}`);
    console.debug(`[Traefik Migration] Migrated: ${result.migrated}`);
    console.debug(`[Traefik Migration] Failed:   ${result.failed}`);
    console.debug(`[Traefik Migration] ========================================`);

    if (result.failed > 0) {
      console.error('[Traefik Migration] Failed containers:');
      result.details
        .filter(d => d.status === 'failed')
        .forEach(d => console.error(`  - ${d.name}: ${d.error}`));
    }
  }
}
