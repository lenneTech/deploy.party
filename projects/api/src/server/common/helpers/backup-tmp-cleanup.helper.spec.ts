import { spawnSync } from 'child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { withTmpCleanup } from './backup-tmp-cleanup.helper';

// The scripts run in a real shell, as they do inside the backed-up container (`docker exec … sh -c`).
function run(script: string) {
  return spawnSync('sh', ['-c', script], { encoding: 'utf8' });
}

describe('withTmpCleanup', () => {
  const name = `dp-dev4397-${process.pid}-${Date.now()}`;
  const dir = `/tmp/${name}`;
  const archive = `/tmp/${name}.tar.gz`;
  const sibling = `/tmp/${name}-other`;

  // Shape of a backup chain: stage files in /tmp, pack them, upload. `(… && exit 1)` is how the backup chains fail.
  const stage = `mkdir -p ${dir} && echo data > ${dir}/file && cd /tmp && tar -czf ${name}.tar.gz ${name}`;

  beforeEach(() => writeFileSync(sibling, 'keep'));
  afterEach(() => [dir, archive, sibling].forEach((p) => rmSync(p, { recursive: true, force: true })));

  it('removes the staged files after a successful chain and exits with 0', () => {
    const result = run(withTmpCleanup(`${stage} && echo 'File verified in S3'`, [dir, archive]));

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('File verified in S3');
    expect(existsSync(dir)).toBe(false);
    expect(existsSync(archive)).toBe(false);
  });

  it('removes the staged files when the upload fails, and the backup still fails', () => {
    const result = run(
      withTmpCleanup(`${stage} && (echo 'S3 upload failed' && exit 1) && echo 'never reached'`, [dir, archive]),
    );

    expect(result.status).toBe(1);
    expect(result.stdout).toContain('S3 upload failed');
    expect(result.stdout).not.toContain('never reached');
    expect(existsSync(dir)).toBe(false);
    expect(existsSync(archive)).toBe(false);
  });

  it('keeps the exit code of the chain', () => {
    expect(run(withTmpCleanup(`${stage} && (exit 3)`, [dir, archive])).status).toBe(3);
  });

  it('leaves everything else in /tmp alone', () => {
    run(withTmpCleanup(stage, [dir, archive]));

    expect(existsSync(sibling)).toBe(true);
  });

  it('does not fail when a path was never created', () => {
    mkdirSync(dir);
    const result = run(withTmpCleanup(`echo ok`, [dir, `/tmp/${name}.sql`]));

    expect(result.status).toBe(0);
    expect(existsSync(dir)).toBe(false);
  });

  it.each([
    '/tmp/',
    '/tmp',
    '/tmp/.',
    '/tmp/..',
    '/tmp/../etc',
    '/tmp/a/b',
    '/tmp/*',
    '/tmp/a b',
    '/tmp/$(reboot)',
    '/tmp/a;rm -rf /',
    '/etc/passwd',
    'tmp/a',
    '',
  ])('refuses to clean up %j', (path) => {
    expect(() => withTmpCleanup('echo ok', [path])).toThrow(/only names directly in \/tmp/);
  });

  it('returns the chain unchanged when there is nothing to clean up or nothing to run', () => {
    expect(withTmpCleanup('echo ok', [])).toBe('echo ok');
    expect(withTmpCleanup('', [dir])).toBe('');
  });
});
