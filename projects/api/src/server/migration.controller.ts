import { Controller, Get, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { LocalhostGuard } from './common/guards/localhost.guard';
import { ProjectService } from './modules/project/project.service';

@Controller('migration')
@UseGuards(LocalhostGuard)
export class MigrationController {
  constructor(private readonly projectService: ProjectService) {}

  @Get('projects')
  async listProjects() {
    const projects = await this.projectService.find(
      {},
      { populate: [{ path: 'containers' }], force: true },
    );

    return projects.map((project) => ({
      id: project.id,
      name: project.name,
      identifier: project.identifier,
      containers: (project.containers || []).map((container: any) => ({
        id: container.id || container._id?.toString(),
        name: container.name,
        kind: container.kind,
        type: container.type,
        status: container.status,
        url: container.url,
        branch: container.branch,
        deploymentType: container.deploymentType,
      })),
    }));
  }

  @Get('projects/:projectId/details')
  async getProjectDetails(@Param('projectId') projectId: string) {
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
      containers: (project.containers || []).map((container: any) => ({
        id: container.id || container._id?.toString(),
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
        registry: container.registry
          ? {
              id: container.registry.id || container.registry._id?.toString(),
              url: container.registry.url,
              username: container.registry.username,
            }
          : null,
        source: container.source
          ? {
              id: container.source.id || container.source._id?.toString(),
              type: container.source.type,
              url: container.source.url,
            }
          : null,
      })),
    };
  }
}
