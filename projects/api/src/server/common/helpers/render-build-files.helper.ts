import { Container } from '../../modules/container/container.model';
import { ContainerType } from '../../modules/container/enums/container-type.enum';
import { getNodeCompose } from '../../modules/container/types/container/compose/node';
import { getStaticCompose } from '../../modules/container/types/container/compose/static';
import { getNodeImage } from '../../modules/container/types/container/images/node';
import { getStaticImage } from '../../modules/container/types/container/images/static';
import { addCustomComposeUpdateDefaults } from './custom-compose-update-config.helper';

export interface RenderedBuildFiles {
  compose?: string;
  dockerfile?: string;
}

/**
 * Dockerfile and compose file of a container that deploy.party builds (NODE, STATIC, CUSTOM),
 * rendered from its settings exactly as DockerService.createDockerfile and createDockerComposeFile
 * write them, but without writing anything. Other types are never built and return nothing;
 * rendering some of them has side effects (generated secrets), so they stay out on purpose.
 *
 * Standalone so that the drift check (scripts/build-files-drift) renders with the same code as the
 * builds, without starting the application.
 */
export async function renderBuildFiles(container: Container): Promise<RenderedBuildFiles> {
  const type = container.type ? container.type : container.kind;

  switch (type) {
    case ContainerType.NODE:
      return { compose: await getNodeCompose(container), dockerfile: await getNodeImage(container) };
    case ContainerType.STATIC:
      return { compose: await getStaticCompose(container), dockerfile: await getStaticImage(container) };
    case ContainerType.CUSTOM:
      return {
        compose: container.customDockerCompose ? addCustomComposeUpdateDefaults(container.customDockerCompose) : undefined,
        dockerfile: container.customDockerfile || undefined,
      };
    default:
      return {};
  }
}
