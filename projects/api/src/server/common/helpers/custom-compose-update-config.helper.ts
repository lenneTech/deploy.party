import { Document, isMap, isScalar, parseDocument, YAMLMap } from 'yaml';

/**
 * Update settings added to every service of a CUSTOM compose that brings no `update_config` (DEV-4068).
 *
 * Without them Swarm uses its defaults `order: stop-first` and `failure_action: pause`: the old task
 * stops, the new one fails, the update pauses and the stage is down. Rollback fixes the outage.
 * The order stays stop-first on purpose, also for the rollback: CUSTOM composes run databases,
 * Redis or Qdrant, and two instances on one volume (start-first) can corrupt the data.
 * `monitor: 30s` gives a new task half a minute to fail before the update counts as done.
 */
export const CUSTOM_UPDATE_CONFIG = { order: 'stop-first', failure_action: 'rollback', monitor: '30s' } as const;
export const CUSTOM_ROLLBACK_CONFIG = { order: 'stop-first' } as const;

/**
 * `update_config.order` exists since compose file format 3.4 and `rollback_config` since 3.7.
 * `docker stack deploy` validates a file against the schema of its declared version and rejects
 * unknown keys, so an older 3.x file is raised to this version when settings are added.
 */
const MIN_COMPOSE_VERSION = { minor: 7, text: '3.7' };

/**
 * Adds CUSTOM_UPDATE_CONFIG and CUSTOM_ROLLBACK_CONFIG to every service of a custom compose file
 * that has no `deploy.update_config`. An existing `update_config` is never changed; such a service
 * stays exactly as written. An existing `rollback_config` is kept as well.
 *
 * The input is returned unchanged (same string) when nothing needs to be added, when it is not valid
 * YAML (`docker stack deploy` reports that itself), or when its shape is unexpected. A service is
 * skipped when `deploy` is no plain map or when it uses a YAML merge key (`<<`): what it inherits
 * cannot be seen here, and adding keys could hide inherited settings.
 *
 * Parsed as YAML 1.1, the dialect of docker's compose loader, so that untouched values keep their
 * meaning and their source form on output (for example `mode: 0440` stays octal, `22:22` stays as is).
 */
export function addCustomComposeUpdateDefaults(compose: string): string {
  if (!compose?.trim()) {
    return compose;
  }

  const doc = parseDocument(compose, { version: '1.1' });
  if (doc.errors.length) {
    return compose;
  }

  const version = parseComposeVersion(doc);
  if (version === 'unsupported') {
    return compose;
  }

  const services = doc.get('services', true);
  if (!isMap(services)) {
    return compose;
  }

  let changed = false;
  for (const { value: service } of services.items) {
    if (!isMap(service) || hasMergeKey(service)) {
      continue;
    }

    let deploy: unknown = service.get('deploy', true);
    if (deploy === undefined || (isScalar(deploy) && deploy.value === null)) {
      deploy = new YAMLMap();
      service.set('deploy', deploy);
    }

    if (!isMap(deploy) || hasMergeKey(deploy) || deploy.has('update_config')) {
      continue;
    }

    deploy.set('update_config', doc.createNode({ ...CUSTOM_UPDATE_CONFIG }));
    if (!deploy.has('rollback_config')) {
      deploy.set('rollback_config', doc.createNode({ ...CUSTOM_ROLLBACK_CONFIG }));
    }
    changed = true;
  }

  if (!changed) {
    return compose;
  }

  if (version && version.minor < MIN_COMPOSE_VERSION.minor) {
    // Double-quoted, so that YAML reads it as the string "3.7" and not as the number 3.7.
    const versionNode = doc.createNode(MIN_COMPOSE_VERSION.text);
    versionNode.type = 'QUOTE_DOUBLE';
    doc.set('version', versionNode);
  }

  // lineWidth 0: no folding of long scalars such as Traefik rules.
  return doc.toString({ lineWidth: 0 });
}

/**
 * null: no `version` key (the current compose format, nothing to raise).
 * 'unsupported': a version other than 3.x. Swarm only deploys 3.x files, so such a file is left as it is.
 */
function parseComposeVersion(doc: Document): { minor: number } | null | 'unsupported' {
  const value = doc.get('version');
  if (value === undefined || value === null) {
    return null;
  }

  const match = /^(\d+)(?:\.(\d+))?$/.exec(String(value).trim());
  if (!match || Number(match[1]) !== 3) {
    return 'unsupported';
  }

  return { minor: Number(match[2] ?? 0) };
}

function hasMergeKey(map: YAMLMap): boolean {
  return map.items.some(({ key }) => (isScalar(key) ? key.value : key) === '<<');
}
