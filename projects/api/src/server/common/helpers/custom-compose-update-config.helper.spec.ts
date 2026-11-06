import { parse } from 'yaml';
import {
  addCustomComposeUpdateDefaults,
  CUSTOM_ROLLBACK_CONFIG,
  CUSTOM_UPDATE_CONFIG,
} from './custom-compose-update-config.helper';

/**
 * DEV-4068: a CUSTOM compose without `update_config` runs with the Swarm defaults stop-first and
 * pause. A failing new task then leaves the stage down. Every service without an own update_config
 * gets rollback, still stop-first, because these composes run databases on volumes.
 */
describe('update defaults for custom composes', () => {
  // Same dialect as the helper and docker's compose loader.
  const read = (yaml: string) => parse(yaml, { version: '1.1' });

  const expectedDefaults = {
    update_config: { order: 'stop-first', failure_action: 'rollback', monitor: '30s' },
    rollback_config: { order: 'stop-first' },
  };

  it('adds update_config and rollback_config to a service without deploy', () => {
    const compose = ['services:', '  redis:', '    image: redis:7', '    volumes:', '      - data:/data', 'volumes:', '  data:', ''].join('\n');

    const result = read(addCustomComposeUpdateDefaults(compose));

    expect(result.services.redis.deploy).toEqual(expectedDefaults);
    expect(result.services.redis.image).toBe('redis:7');
    expect(result.volumes).toEqual({ data: null });
  });

  it('adds both to a service with deploy but without update_config and keeps the other deploy settings', () => {
    const compose = [
      'services:',
      '  qdrant:',
      '    image: qdrant/qdrant',
      '    deploy:',
      '      placement:',
      '        constraints:',
      '          - node.role == manager',
      '      resources:',
      '        limits:',
      '          memory: 2G',
      '',
    ].join('\n');

    const deploy = read(addCustomComposeUpdateDefaults(compose)).services.qdrant.deploy;

    expect(deploy).toEqual({
      placement: { constraints: ['node.role == manager'] },
      resources: { limits: { memory: '2G' } },
      ...expectedDefaults,
    });
  });

  it('never touches an existing update_config, the file stays byte for byte the same', () => {
    const compose = [
      'services:',
      '  db:',
      '    image: postgres:16',
      '    deploy:',
      '      update_config:',
      '        order: start-first',
      '        failure_action: pause',
      '',
    ].join('\n');

    expect(addCustomComposeUpdateDefaults(compose)).toBe(compose);
  });

  it('keeps an existing update_config without adding a rollback_config, even if empty', () => {
    const compose = ['services:', '  db:', '    image: postgres:16', '    deploy:', '      update_config: {}', ''].join('\n');

    expect(addCustomComposeUpdateDefaults(compose)).toBe(compose);
  });

  it('handles every service of a compose with several services on its own', () => {
    const compose = [
      'services:',
      '  app:',
      '    image: app:1',
      '    deploy:',
      '      update_config:',
      '        order: start-first',
      '        parallelism: 2',
      '  redis:',
      '    image: redis:7',
      '  mongo:',
      '    image: mongo:7',
      '    deploy:',
      '      replicas: 1',
      '  worker:',
      '    image: worker:1',
      '    deploy:',
      '      rollback_config:',
      '        order: start-first',
      '',
    ].join('\n');

    const services = read(addCustomComposeUpdateDefaults(compose)).services;

    expect(services.app.deploy).toEqual({ update_config: { order: 'start-first', parallelism: 2 } });
    expect(services.redis.deploy).toEqual(expectedDefaults);
    expect(services.mongo.deploy).toEqual({ replicas: 1, ...expectedDefaults });
    // An existing rollback_config is kept; only the missing update_config is added.
    expect(services.worker.deploy).toEqual({ rollback_config: { order: 'start-first' }, update_config: expectedDefaults.update_config });
  });

  it('treats an empty deploy key like a missing one', () => {
    const compose = ['services:', '  redis:', '    image: redis:7', '    deploy:', ''].join('\n');

    expect(read(addCustomComposeUpdateDefaults(compose)).services.redis.deploy).toEqual(expectedDefaults);
  });

  it('exports the settings it adds', () => {
    expect({ update_config: CUSTOM_UPDATE_CONFIG, rollback_config: CUSTOM_ROLLBACK_CONFIG }).toEqual(expectedDefaults);
  });

  describe('compose file version', () => {
    const withVersion = (version: string) => [`version: ${version}`, 'services:', '  redis:', '    image: redis:7', ''].join('\n');

    it('raises a 3.x version below 3.7, because stack deploy rejects rollback_config there', () => {
      for (const version of ["'3'", '"3.3"', '3.6']) {
        const result = addCustomComposeUpdateDefaults(withVersion(version));

        expect(result).toContain('version: "3.7"');
        expect(read(result).version).toBe('3.7');
        expect(read(result).services.redis.deploy).toEqual(expectedDefaults);
      }
    });

    it('keeps a version of 3.7 or newer and adds no version when there is none', () => {
      expect(addCustomComposeUpdateDefaults(withVersion("'3.8'"))).toContain("version: '3.8'");
      expect(read(addCustomComposeUpdateDefaults(withVersion("'3.8'"))).services.redis.deploy).toEqual(expectedDefaults);

      const withoutVersion = addCustomComposeUpdateDefaults(['services:', '  redis:', '    image: redis:7', ''].join('\n'));
      expect(read(withoutVersion).version).toBeUndefined();
    });

    it('does not raise the version when nothing is added', () => {
      const compose = ["version: '3.3'", 'services:', '  db:', '    image: postgres', '    deploy:', '      update_config:', '        parallelism: 1', ''].join('\n');

      expect(addCustomComposeUpdateDefaults(compose)).toBe(compose);
    });

    it('leaves files of another major version alone', () => {
      const compose = withVersion("'2.4'");

      expect(addCustomComposeUpdateDefaults(compose)).toBe(compose);
    });
  });

  describe('input it must not change', () => {
    it('returns empty, invalid or service-less input unchanged', () => {
      for (const compose of [undefined, '', '   ', 'services: [unclosed', 'services:\n  - a\n  - b\n', 'networks:\n  x:\n    external: true\n']) {
        expect(addCustomComposeUpdateDefaults(compose)).toBe(compose);
      }
    });

    it('skips services that use a merge key or an alias, because inherited settings are not visible', () => {
      const compose = [
        'x-deploy: &deploy',
        '  update_config:',
        '    order: start-first',
        'x-base: &base',
        '  image: redis:7',
        'services:',
        '  merged:',
        '    <<: *base',
        '  aliased:',
        '    image: redis:7',
        '    deploy: *deploy',
        '  mergedDeploy:',
        '    image: redis:7',
        '    deploy:',
        '      <<: *deploy',
        '',
      ].join('\n');

      expect(addCustomComposeUpdateDefaults(compose)).toBe(compose);
    });
  });

  it('keeps comments and the meaning of every untouched value', () => {
    const compose = [
      '# Redis for the session store',
      'services:',
      '  redis:',
      '    image: redis:7 # pinned',
      '    command: redis-server --requirepass $${REDIS_PASSWORD}',
      '    environment:',
      '      TZ: ${TZ:-Europe/Berlin}',
      '      APPENDONLY: on',
      '    ports:',
      '      - 22:22',
      '      - "6379:6379"',
      '    labels:',
      '      - traefik.http.routers.redis.rule=Host(`redis.example.com`) || Host(`www.redis.example.com`) || Host(`cache.redis.example.com`)',
      '    configs:',
      '      - source: redis_conf',
      '        target: /usr/local/etc/redis/redis.conf',
      '        mode: 0440',
      'configs:',
      '  redis_conf:',
      '    file: ./redis.conf',
      '',
    ].join('\n');

    const result = addCustomComposeUpdateDefaults(compose);
    const before = read(compose);
    const after = read(result);

    expect(result).toContain('# Redis for the session store');
    expect(result).toContain('# pinned');
    expect(result).toContain('mode: 0440');
    expect(result).toContain('- 22:22');
    expect(result).toContain('APPENDONLY: on');
    // A long Traefik rule stays on one line.
    expect(result).toContain('- traefik.http.routers.redis.rule=Host(`redis.example.com`) || Host(`www.redis.example.com`) || Host(`cache.redis.example.com`)');

    const { deploy, ...restAfter } = after.services.redis;
    expect(deploy).toEqual(expectedDefaults);
    expect(restAfter).toEqual(before.services.redis);
    expect(after.configs).toEqual(before.configs);
  });
});
