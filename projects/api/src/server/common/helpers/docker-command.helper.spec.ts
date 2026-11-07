import {
  composeBuildArgs,
  composePushArgs,
  containerIdsByLabelArgs,
  containerStatsArgs,
  deployArgs,
  isValidLogsSince,
  logsArgs,
  runningContainersByLabelArgs,
  runningContainersByNamePrefixArgs,
  stopArgs,
  volumeRmArgs,
} from './docker-command.helper';

const ID = '6870c82071f53d2a9dac206b';
const PATH = `/data/projects/${ID}/feature/dev-4068`;

describe('docker command arguments', () => {
  it('deploys a Swarm stack, with the registry config only when it exists', () => {
    expect(deployArgs({ configExist: false, path: PATH, stack: ID, swarm: true })).toEqual([
      'stack', 'deploy', '-c', `${PATH}/docker-compose.yml`, ID,
    ]);
    expect(deployArgs({ configExist: true, path: PATH, stack: ID, swarm: true })).toEqual([
      '--config', `${PATH}/.docker`, 'stack', 'deploy', '-c', `${PATH}/docker-compose.yml`, ID,
    ]);
  });

  it('deploys with compose outside Swarm', () => {
    expect(deployArgs({ configExist: false, path: PATH, stack: ID, swarm: false })).toEqual([
      'compose', '--project-directory', PATH, 'up', '-d',
    ]);
  });

  it('keeps a path with shell characters in one argument', () => {
    const path = '/data/projects/x/v1$(touch /tmp/pwned);echo';
    const args = deployArgs({ configExist: true, path, stack: ID, swarm: true });
    expect(args).toContain(`${path}/docker-compose.yml`);
    expect(args).toContain(`${path}/.docker`);
    expect(composeBuildArgs(path)).toEqual(['compose', '--project-directory', path, 'build']);
  });

  it('stops a stack or a compose project', () => {
    expect(stopArgs({ path: PATH, stack: ID, swarm: true })).toEqual(['stack', 'rm', ID]);
    expect(stopArgs({ path: PATH, stack: ID, swarm: false })).toEqual(['compose', '--project-directory', PATH, 'down']);
  });

  it('builds and pushes in the build folder', () => {
    expect(composeBuildArgs(PATH)).toEqual(['compose', '--project-directory', PATH, 'build']);
    expect(composePushArgs(PATH, false)).toEqual(['compose', '--project-directory', PATH, 'push']);
    expect(composePushArgs(PATH, true)).toEqual(['--config', `${PATH}/.docker`, 'compose', '--project-directory', PATH, 'push']);
  });

  it('filters containers by label and name prefix without shell quoting', () => {
    expect(containerIdsByLabelArgs(ID)).toEqual(['ps', '-a', '--filter', `label=deploy.party.id=${ID}`, '--format', '{{.ID}}']);
    expect(runningContainersByLabelArgs(ID)).toEqual(['ps', '--filter', `label=deploy.party.id=${ID}`, '--format', '{{json .}}']);
    expect(runningContainersByNamePrefixArgs(ID)).toEqual(['ps', '--filter', `name=^${ID}_`, '--format', '{{json .}}']);
  });

  it('reads stats and removes the volume of a container', () => {
    expect(containerStatsArgs('abc123')).toEqual(['container', 'stats', 'abc123', '--no-stream', '--no-trunc', '--format', '{{json .}}']);
    expect(volumeRmArgs(ID)).toEqual(['volume', 'rm', `${ID}_${ID}`]);
  });
});

describe('logsArgs', () => {
  it('reads the last 2000 lines without since', () => {
    expect(logsArgs('abc123')).toEqual(['logs', '--tail', '2000', '--timestamps', 'abc123']);
    expect(logsArgs('abc123', '')).toEqual(['logs', '--tail', '2000', '--timestamps', 'abc123']);
  });

  it('passes the ISO timestamp the log cron sends', () => {
    const since = new Date('2026-11-07T13:05:00.123Z').toISOString();
    expect(logsArgs('abc123', since)).toEqual(['logs', '--since', since, '--tail', '2000', '--timestamps', 'abc123']);
  });

  it.each(['2026-11-07', '2026-11-07T13:05', '2026-11-07T13:05:00+01:00', '1794055270', '1794055270.5', '10m', '1h30m', '1.5h', '500ms'])(
    'accepts %p',
    (since) => {
      expect(isValidLogsSince(since)).toBe(true);
    },
  );

  it.each(['10m; id', '$(id)', '`id`', '1h && touch /tmp/x', '--details', '2026-11-07 13:05', 'yesterday', '10m\nid'])(
    'rejects %p before docker runs',
    (since) => {
      expect(isValidLogsSince(since)).toBe(false);
      expect(() => logsArgs('abc123', since)).toThrow('Invalid value for since');
    },
  );
});
