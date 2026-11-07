/**
 * Argument lists for the docker commands of DockerService. They run through `execa('docker', args)`
 * without a shell, so a branch or tag in the project path, or a value from a GraphQL argument, is
 * passed to docker as one argument and never interpreted by a shell.
 *
 * Before, these commands were template strings with `shell: true`. The `since` argument of the
 * query `getContainerLogs`, open to every signed-in user, went into such a string unchecked.
 */

/** `--config <path>/.docker` when the container has registry credentials, otherwise nothing. */
function configArgs(path: string, configExist: boolean): string[] {
  return configExist ? ['--config', `${path}/.docker`] : [];
}

/** `docker stack deploy` (Swarm) or `docker compose up -d` for the build folder of a container. */
export function deployArgs(options: { configExist: boolean; path: string; stack: string; swarm: boolean }): string[] {
  const { configExist, path, stack, swarm } = options;
  return swarm
    ? [...configArgs(path, configExist), 'stack', 'deploy', '-c', `${path}/docker-compose.yml`, stack]
    : [...configArgs(path, configExist), 'compose', '--project-directory', path, 'up', '-d'];
}

/** `docker stack rm` (Swarm) or `docker compose down`. */
export function stopArgs(options: { path: string; stack: string; swarm: boolean }): string[] {
  const { path, stack, swarm } = options;
  return swarm ? ['stack', 'rm', stack] : ['compose', '--project-directory', path, 'down'];
}

/** `docker compose build` in the build folder. */
export function composeBuildArgs(path: string): string[] {
  return ['compose', '--project-directory', path, 'build'];
}

/** `docker compose push` in the build folder, with the registry credentials when there are any. */
export function composePushArgs(path: string, configExist: boolean): string[] {
  return [...configArgs(path, configExist), 'compose', '--project-directory', path, 'push'];
}

/** IDs of all containers (also stopped ones) with the deploy.party label of a container. */
export function containerIdsByLabelArgs(containerId: string): string[] {
  return ['ps', '-a', '--filter', `label=deploy.party.id=${containerId}`, '--format', '{{.ID}}'];
}

/** Running containers with the deploy.party label, one JSON object per line. */
export function runningContainersByLabelArgs(containerId: string): string[] {
  return ['ps', '--filter', `label=deploy.party.id=${containerId}`, '--format', '{{json .}}'];
}

/** Running containers whose name starts with `<containerId>_`, one JSON object per line. */
export function runningContainersByNamePrefixArgs(containerId: string): string[] {
  return ['ps', '--filter', `name=^${containerId}_`, '--format', '{{json .}}'];
}

/** `docker container stats` once, as JSON. */
export function containerStatsArgs(dockerId: string): string[] {
  return ['container', 'stats', dockerId, '--no-stream', '--no-trunc', '--format', '{{json .}}'];
}

/** The volume of a database or service container (`<id>_<id>`). */
export function volumeRmArgs(containerId: string): string[] {
  return ['volume', 'rm', `${containerId}_${containerId}`];
}

/**
 * Values `docker logs --since` understands: an RFC 3339 timestamp (`2026-11-07T13:05:00.000Z`,
 * also with an offset or without seconds), a Unix timestamp (`1794055270` or with fractions), or a
 * relative duration (`42m`, `1h30m`, `1.5h`, `500ms`).
 */
const LOGS_SINCE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})?)?$/,
  /^\d{1,12}(\.\d{1,9})?$/,
  /^(\d{1,6}(\.\d{1,9})?(ns|us|µs|ms|s|m|h))+$/,
];

export function isValidLogsSince(since: string): boolean {
  return LOGS_SINCE_PATTERNS.some((pattern) => pattern.test(since));
}

/**
 * `docker logs` with the last 2000 lines and timestamps. Throws for a `since` that docker would not
 * understand, so a crafted value fails before docker runs.
 */
export function logsArgs(dockerId: string, since?: string): string[] {
  if (since !== undefined && since !== null && since !== '') {
    if (!isValidLogsSince(since)) {
      throw new Error('Invalid value for since, expected a timestamp or a duration such as 10m');
    }
    return ['logs', '--since', since, '--tail', '2000', '--timestamps', dockerId];
  }
  return ['logs', '--tail', '2000', '--timestamps', dockerId];
}
