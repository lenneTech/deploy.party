import { spawnSync } from 'child_process';
import { existsSync, rmSync, writeFileSync } from 'fs';
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
  const files = { staging: [dir], archive };

  // Shape of a backup chain: stage files in /tmp, pack them, upload. `(… && exit 1)` is how the backup chains fail.
  const stage = `mkdir -p ${dir} && echo data > ${dir}/file && cd /tmp && tar -czf ${name}.tar.gz ${name}`;
  const uploadFails = `(echo 'S3 upload failed' && exit 1) && echo 'never reached'`;

  beforeEach(() => writeFileSync(sibling, 'keep'));
  afterEach(() => [dir, archive, sibling].forEach((p) => rmSync(p, { recursive: true, force: true })));

  it('removes staging files and archive after a successful chain and exits with 0', () => {
    const result = run(withTmpCleanup(`${stage} && echo 'File verified in S3'`, files));

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('File verified in S3');
    expect(existsSync(dir)).toBe(false);
    expect(existsSync(archive)).toBe(false);
  });

  it('keeps the complete archive when the upload fails, removes the staging files, and the backup still fails', () => {
    const result = run(withTmpCleanup(`${stage} && ${uploadFails}`, files));

    expect(result.status).toBe(1);
    expect(result.stdout).toContain('S3 upload failed');
    expect(result.stdout).not.toContain('never reached');
    expect(result.stdout).toContain(`Backup not in S3, archive kept: ${archive}`);
    expect(existsSync(dir)).toBe(false);
    expect(spawnSync('tar', ['-tzf', archive], { encoding: 'utf8' }).stdout).toContain(`${name}/file`);
  });

  it('removes an incomplete archive, for example when packing failed on a full disk', () => {
    const result = run(
      withTmpCleanup(`mkdir -p ${dir} && printf 'not a complete gzip' > ${archive} && (exit 1)`, files),
    );

    expect(result.status).toBe(1);
    expect(result.stdout).not.toContain('archive kept');
    expect(existsSync(dir)).toBe(false);
    expect(existsSync(archive)).toBe(false);
  });

  it('removes the staging files when the chain fails before any archive exists', () => {
    const result = run(withTmpCleanup(`mkdir -p ${dir} && (echo 'dump failed' && exit 2)`, files));

    expect(result.status).toBe(2);
    expect(result.stdout).not.toContain('archive kept');
    expect(existsSync(dir)).toBe(false);
  });

  it('keeps the exit code of the chain', () => {
    expect(run(withTmpCleanup(`${stage} && (exit 3)`, files)).status).toBe(3);
  });

  it('leaves everything else in /tmp alone', () => {
    run(withTmpCleanup(stage, files));
    run(withTmpCleanup(`${stage} && ${uploadFails}`, files));

    expect(existsSync(sibling)).toBe(true);
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
    expect(() => withTmpCleanup('echo ok', { staging: [path], archive })).toThrow(/only names directly in \/tmp/);
    expect(() => withTmpCleanup('echo ok', { staging: [dir], archive: path })).toThrow(/only names directly in \/tmp/);
  });

  it('returns the chain unchanged when there is nothing to clean up or nothing to run', () => {
    expect(withTmpCleanup('echo ok', undefined)).toBe('echo ok');
    expect(withTmpCleanup('', files)).toBe('');
  });
});
