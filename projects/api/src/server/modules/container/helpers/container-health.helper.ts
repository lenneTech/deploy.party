import { ContainerHealthStatus } from '../enums/container-health-status.enum';
import { ContainerStatus } from '../enums/container-status.enum';
import { ContainerType } from '../enums/container-type.enum';

/**
 * Status and health of a container derived from Docker (DEV-4068).
 *
 * The Docker event `start` used to set DEPLOYED, and the overview called a container without
 * healthCheckCmd healthy whenever it was DEPLOYED. A crash loop starts the container again and again,
 * so it looked deployed and healthy. Every NODE container has a healthcheck now; for containers with
 * a healthcheck only the health decides.
 */

const EVENT_START = 'start';
const EVENT_HEALTHY = 'health_status: healthy';

/**
 * Only these Docker events can change the status. Everything else (among them the exec events every
 * healthcheck run produces every 5 s) is dropped before any lookup.
 */
export function isStatusRelevantDockerEvent(action: string | undefined): boolean {
  return action === EVENT_START || action === EVENT_HEALTHY;
}

/**
 * Whether a Docker event marks the container DEPLOYED: `health_status: healthy` always, `start` only
 * for a container without healthcheck. With a healthcheck a start says nothing yet; a crash loop
 * starts often but never becomes healthy.
 */
export function marksContainerDeployed(action: string | undefined, hasHealthcheck: boolean): boolean {
  if (action === EVENT_HEALTHY) {
    return true;
  }
  return action === EVENT_START && !hasHealthcheck;
}

/**
 * Output of `docker inspect --format '{{json .Config.Healthcheck}}'`: `null` without healthcheck,
 * `{"Test":["NONE"]}` for a disabled one, otherwise the configured check.
 */
export function hasActiveHealthcheck(inspectOutput: string): boolean {
  try {
    const test = JSON.parse(inspectOutput)?.Test;
    return Array.isArray(test) && test.length > 0 && test[0] !== 'NONE';
  } catch {
    return false;
  }
}

/** Health of running containers by deploy.party id; null for one that runs without healthcheck. */
export type RunningContainersHealth = Map<string, ContainerHealthStatus | null>;

/**
 * `docker ps --format '{{.Label "deploy.party.id"}} {{.Status}}'` lists only running (and
 * restarting) containers, so it needs one call for all containers. The health is part of the
 * status: "Up 2 hours (healthy)", "Up 5 seconds (health: starting)", "Up 1 minute (unhealthy)",
 * "Up 3 minutes" without healthcheck, "Restarting (1) 2 seconds ago" in a crash loop.
 *
 * Several containers of one deploy.party container (a start-first update, or a stack with several
 * services) report the worst state: unhealthy before starting before healthy.
 */
export function parseRunningContainersHealth(stdout: string): RunningContainersHealth {
  const rank = (health: ContainerHealthStatus | null) =>
    health === ContainerHealthStatus.UNHEALTHY ? 3 : health === ContainerHealthStatus.STARTING ? 2 : health === ContainerHealthStatus.HEALTHY ? 1 : 0;
  const result: RunningContainersHealth = new Map();

  for (const line of (stdout ?? '').split('\n')) {
    const separator = line.indexOf(' ');
    const id = (separator > 0 ? line.slice(0, separator) : line).trim();
    if (!id) {
      continue;
    }

    const health = healthFromDockerPsStatus(separator > 0 ? line.slice(separator + 1) : '');
    if (!result.has(id) || rank(health) > rank(result.get(id))) {
      result.set(id, health);
    }
  }

  return result;
}

function healthFromDockerPsStatus(status: string): ContainerHealthStatus | null {
  if (/\(unhealthy\)/.test(status) || /^\s*restarting\b/i.test(status)) {
    return ContainerHealthStatus.UNHEALTHY;
  }
  if (/\(health: starting\)/.test(status)) {
    return ContainerHealthStatus.STARTING;
  }
  if (/\(healthy\)/.test(status)) {
    return ContainerHealthStatus.HEALTHY;
  }
  return null;
}

/**
 * Docker health of one deploy.party container from the running containers: UNHEALTHY when none
 * runs, null when it runs without healthcheck.
 */
export function dockerHealthOf(containerId: string, running: RunningContainersHealth): ContainerHealthStatus | null {
  return running.has(containerId) ? running.get(containerId) : ContainerHealthStatus.UNHEALTHY;
}

/**
 * Containers whose health comes from Docker: every NODE container (default healthcheck since
 * DEV-4068) and every other one with its own healthCheckCmd.
 */
export function usesDockerHealthcheck(container: { healthCheckCmd?: string; type?: string }): boolean {
  return !!container.healthCheckCmd || container.type === ContainerType.NODE;
}

/**
 * Health from the stored status alone, for containers without a healthcheck (unchanged from before).
 */
export function healthFromContainerStatus(status: ContainerStatus | undefined): ContainerHealthStatus {
  if (status === ContainerStatus.DEPLOYED) {
    return ContainerHealthStatus.HEALTHY;
  }
  return status === ContainerStatus.BUILDING ? ContainerHealthStatus.IDLE : ContainerHealthStatus.UNHEALTHY;
}

/**
 * Health shown in the project overview.
 *
 * - Containers without Docker health, and every container that is not DEPLOYED: from the status.
 * - Deployed containers with Docker health: Docker's health of the running containers, so a crash
 *   loop shows STARTING or UNHEALTHY instead of HEALTHY, and nothing running shows UNHEALTHY.
 * - A running container without healthcheck is a NODE container built before DEV-4068; until its
 *   next build it keeps the old status-based health instead of turning red although it runs.
 * - `running` null: docker could not be asked; the status decides as before.
 */
export function resolveOverviewHealth(
  container: { healthCheckCmd?: string; id?: string; status?: ContainerStatus; type?: string },
  running: RunningContainersHealth | null,
): ContainerHealthStatus {
  const fromStatus = healthFromContainerStatus(container.status);
  if (container.status !== ContainerStatus.DEPLOYED || !usesDockerHealthcheck(container) || !running || !container.id) {
    return fromStatus;
  }
  return dockerHealthOf(String(container.id), running) ?? fromStatus;
}
