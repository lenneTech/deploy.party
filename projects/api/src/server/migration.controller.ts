import { Controller, Get, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { LocalhostGuard } from './common/guards/localhost.guard';
import { ProjectService } from './modules/project/project.service';
import { MigrationProjectDto, MigrationProjectDetailDto } from './migration/dto/migration-project.dto';
import { MigrationContainerDto, MigrationContainerDetailDto } from './migration/dto/migration-container.dto';
import { Container } from './modules/container/container.model';
import { Registry } from './modules/registry/registry.model';
import { Source } from './modules/source/source.model';

@Controller('migration')
@UseGuards(LocalhostGuard)
export class MigrationController {
  constructor(private readonly projectService: ProjectService) {}

  @Get('projects')
  async listProjects(): Promise<MigrationProjectDto[]> {
    const projects = await this.projectService.find(
      {},
      { populate: [{ path: 'containers' }], force: true },
    );

    return projects.map((project) => ({
      id: project.id,
      name: project.name,
      identifier: project.identifier,
      containers: ((project.containers || []) as Container[]).map((container: Container) => {
        const containerDto: MigrationContainerDto = {
          id: container.id || (container as any)._id?.toString(),
          name: container.name,
          kind: container.kind,
          type: container.type,
          status: container.status,
          url: container.url,
          branch: container.branch,
          deploymentType: container.deploymentType,
        };
        return containerDto;
      }),
    }));
  }

  @Get('projects/:projectId/details')
  async getProjectDetails(@Param('projectId') projectId: string): Promise<MigrationProjectDetailDto> {
    const project = await this.projectService.get(projectId, {
      populate: [
        {
          path: 'containers',
          populate: [
            { path: 'registry' },
            { path: 'source' },
          ],
        },
      ],
      force: true,
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    return {
      id: project.id,
      name: project.name,
      identifier: project.identifier,
      containers: ((project.containers || []) as Container[]).map((container: Container) => {
        // Type assertion is safe here because we explicitly populate registry and source above
        const registry = typeof container.registry === 'string' ? null : container.registry as Registry | undefined;
        const source = typeof container.source === 'string' ? null : container.source as Source | undefined;
        
        const containerDto: MigrationContainerDetailDto = {
          id: container.id || (container as any)._id?.toString(),
          name: container.name,
          kind: container.kind,
          type: container.type,
          status: container.status,
          url: container.url,
          branch: container.branch,
          tag: container.tag,
          deploymentType: container.deploymentType,
          port: container.port,
          ssl: container.ssl,
          www: container.www,
          buildImage: container.buildImage,
          buildCmd: container.buildCmd,
          installCmd: container.installCmd,
          startCmd: container.startCmd,
          healthCheckCmd: container.healthCheckCmd,
          maxMemory: container.maxMemory,
          baseDir: container.baseDir,
          repositoryUrl: container.repositoryUrl,
          volumes: container.volumes,
          additionalNetworks: container.additionalNetworks,
          registry: registry
            ? {
                id: registry.id || (registry as any)._id?.toString(),
                url: registry.url,
                username: registry.username,
              }
            : null,
          source: source
            ? {
                id: source.id || (source as any)._id?.toString(),
                type: source.type,
                url: source.url,
              }
            : null,
        };
        return containerDto;
      }),
    };
  }
}
