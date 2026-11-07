import { DeploymentType } from '../enums/deployment-type.enum';
import { TagMatchType } from '../enums/tag-match-type.enum';

/**
 * Branch or tag a container deploys, or with `path` the name of its folder below the project
 * directory. Moved out of ContainerService unchanged, so that the drift check
 * (scripts/build-files-drift) finds the same folder without loading the service and its models.
 */
export function getContainerSource(
  container: { branch?: string; deploymentType?: string; tag?: string; tagMatchType?: string; tagPattern?: string },
  path = false,
): string {
  if (container.deploymentType === DeploymentType.BRANCH) {
    return container.branch;
  }

  if (container.deploymentType === DeploymentType.TAG && container.tagMatchType === TagMatchType.PATTERN) {
    if (!path) {
      return container.tag;
    } else {
      // Convert tag pattern to a path-like format
      const pattern = container.tagPattern;
      // remove all special characters except alphanumeric, underscore, and hyphen
      return pattern.replace(/[^a-zA-Z0-9_-]/g, '_');
    }
  }

  if (container.deploymentType === DeploymentType.TAG) {
    return container.tag;
  }

  // Default case if no deployment type matches
  return 'unknown';
}
