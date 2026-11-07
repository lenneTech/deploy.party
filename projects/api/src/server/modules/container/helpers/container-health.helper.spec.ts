import { ContainerHealthStatus } from '../enums/container-health-status.enum';
import { ContainerStatus } from '../enums/container-status.enum';
import { ContainerType } from '../enums/container-type.enum';
import {
  dockerHealthOf,
  hasActiveHealthcheck,
  healthFromContainerStatus,
  isStatusRelevantDockerEvent,
  marksContainerDeployed,
  parseRunningContainersHealth,
  resolveOverviewHealth,
  usesDockerHealthcheck,
} from './container-health.helper';

/**
 * DEV-4068: every Docker `start` event set DEPLOYED and the overview called a DEPLOYED container
 * without healthCheckCmd healthy, so a crash loop looked deployed and healthy.
 */
describe('container status and health from Docker', () => {
  describe('Docker events', () => {
    it('only lets start and healthy events through', () => {
      for (const action of ['start', 'health_status: healthy']) {
        expect(isStatusRelevantDockerEvent(action)).toBe(true);
      }
      // A healthcheck run produces exec events every 5 s; they must not even reach the database.
      for (const action of ['exec_create: node -e x', 'exec_start: node -e x', 'exec_die', 'die', 'kill', 'health_status: unhealthy', 'health_status: starting', undefined]) {
        expect(isStatusRelevantDockerEvent(action)).toBe(false);
      }
    });

    it('marks a container with healthcheck deployed only once it is healthy, never on start', () => {
      expect(marksContainerDeployed('start', true)).toBe(false);
      expect(marksContainerDeployed('health_status: healthy', true)).toBe(true);
    });

    it('keeps start as the signal for containers without healthcheck', () => {
      expect(marksContainerDeployed('start', false)).toBe(true);
      expect(marksContainerDeployed('die', false)).toBe(false);
    });

    it('recognises an active healthcheck in docker inspect output', () => {
      expect(hasActiveHealthcheck('{"Test":["CMD","node","-e","require(\'net\')"],"Interval":5000000000,"Retries":60}')).toBe(true);
      expect(hasActiveHealthcheck('{"Test":["CMD-SHELL","curl -f http://localhost || exit 1"]}')).toBe(true);
      expect(hasActiveHealthcheck('{"Test":["NONE"]}')).toBe(false);
      expect(hasActiveHealthcheck('null')).toBe(false);
      expect(hasActiveHealthcheck('')).toBe(false);
    });
  });

  describe('health of running containers from docker ps', () => {
    it('reads the health from the status column, one docker call for all containers', () => {
      const stdout = [
        'aaa Up 2 hours (healthy)',
        'bbb Up 4 seconds (health: starting)',
        'ccc Up 6 minutes (unhealthy)',
        'ddd Up 3 days',
        'eee Restarting (1) 2 seconds ago',
        '',
      ].join('\n');

      expect(parseRunningContainersHealth(stdout)).toEqual(
        new Map([
          ['aaa', ContainerHealthStatus.HEALTHY],
          ['bbb', ContainerHealthStatus.STARTING],
          ['ccc', ContainerHealthStatus.UNHEALTHY],
          // Runs without healthcheck: the caller decides.
          ['ddd', null],
          // A crash loop without healthcheck in compose mode.
          ['eee', ContainerHealthStatus.UNHEALTHY],
        ]),
      );
    });

    it('reports the worst state when several containers belong to one deploy.party container', () => {
      // During a start-first update the new task starts next to the old, healthy one.
      expect(parseRunningContainersHealth('aaa Up 3 seconds (health: starting)\naaa Up 2 hours (healthy)').get('aaa')).toBe(
        ContainerHealthStatus.STARTING,
      );
      expect(parseRunningContainersHealth('aaa Up 2 hours (healthy)\naaa Up 1 minute (unhealthy)').get('aaa')).toBe(ContainerHealthStatus.UNHEALTHY);
      expect(parseRunningContainersHealth('aaa Up 2 hours\naaa Up 2 hours (healthy)').get('aaa')).toBe(ContainerHealthStatus.HEALTHY);
    });

    it('is UNHEALTHY for a container of which nothing runs', () => {
      const running = parseRunningContainersHealth('aaa Up 2 hours (healthy)\nddd Up 3 days');

      expect(dockerHealthOf('aaa', running)).toBe(ContainerHealthStatus.HEALTHY);
      expect(dockerHealthOf('ddd', running)).toBeNull();
      expect(dockerHealthOf('zzz', running)).toBe(ContainerHealthStatus.UNHEALTHY);
      expect(parseRunningContainersHealth('')).toEqual(new Map());
    });
  });

  describe('overview health', () => {
    const node = { id: 'n1', type: ContainerType.NODE, status: ContainerStatus.DEPLOYED };
    const running = (line: string) => parseRunningContainersHealth(line);

    it('uses Docker health for every NODE container and for any container with healthCheckCmd', () => {
      expect(usesDockerHealthcheck({ type: ContainerType.NODE })).toBe(true);
      expect(usesDockerHealthcheck({ type: ContainerType.CUSTOM, healthCheckCmd: 'pg_isready' })).toBe(true);
      expect(usesDockerHealthcheck({ type: ContainerType.STATIC })).toBe(false);
      expect(usesDockerHealthcheck({ type: ContainerType.CUSTOM })).toBe(false);
    });

    it('does not show a NODE container in a crash loop as healthy', () => {
      expect(resolveOverviewHealth(node, running('n1 Up 2 seconds (health: starting)'))).toBe(ContainerHealthStatus.STARTING);
      expect(resolveOverviewHealth(node, running('n1 Up 5 minutes (unhealthy)'))).toBe(ContainerHealthStatus.UNHEALTHY);
      // Between two restarts nothing of it runs.
      expect(resolveOverviewHealth(node, running(''))).toBe(ContainerHealthStatus.UNHEALTHY);
      expect(resolveOverviewHealth(node, running('n1 Up 2 hours (healthy)'))).toBe(ContainerHealthStatus.HEALTHY);
    });

    it('keeps the status-based health for a NODE container whose running image predates the default healthcheck', () => {
      expect(resolveOverviewHealth(node, running('n1 Up 3 days'))).toBe(ContainerHealthStatus.HEALTHY);
    });

    it('keeps the status-based health when docker could not be asked', () => {
      expect(resolveOverviewHealth(node, null)).toBe(ContainerHealthStatus.HEALTHY);
    });

    it('derives the health from the status when the container is not deployed or has no Docker health', () => {
      expect(resolveOverviewHealth({ ...node, status: ContainerStatus.BUILDING }, running(''))).toBe(ContainerHealthStatus.IDLE);
      expect(resolveOverviewHealth({ ...node, status: ContainerStatus.DIED }, running('n1 Up 2 hours (healthy)'))).toBe(ContainerHealthStatus.UNHEALTHY);
      expect(resolveOverviewHealth({ id: 's1', type: ContainerType.STATIC, status: ContainerStatus.DEPLOYED }, running(''))).toBe(
        ContainerHealthStatus.HEALTHY,
      );
    });

    it('maps the status like before for containers without healthcheck', () => {
      expect(healthFromContainerStatus(ContainerStatus.DEPLOYED)).toBe(ContainerHealthStatus.HEALTHY);
      expect(healthFromContainerStatus(ContainerStatus.BUILDING)).toBe(ContainerHealthStatus.IDLE);
      for (const status of [ContainerStatus.DIED, ContainerStatus.STOPPED, ContainerStatus.STOPPED_BY_SYSTEM, ContainerStatus.DRAFT, undefined]) {
        expect(healthFromContainerStatus(status)).toBe(ContainerHealthStatus.UNHEALTHY);
      }
    });
  });
});
