import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { describeBuildFileChanges, isBuildFileRefreshEnabled, writeBuildFile } from './build-files.helper';

/**
 * DEV-4068: builds write the build files from the container settings. A file is only touched when
 * its content changes, and the previous version stays next to it.
 */
describe('build files', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(join(tmpdir(), 'build-files-'));
  });

  afterEach(async () => {
    await fs.rm(dir, { force: true, recursive: true });
  });

  it('creates a missing file', async () => {
    const path = join(dir, 'Dockerfile');

    expect(await writeBuildFile(path, 'FROM node:20')).toBe('created');
    expect(await fs.readFile(path, 'utf8')).toBe('FROM node:20');
    await expect(fs.access(`${path}.prev`)).rejects.toThrow();
  });

  it('leaves an identical file alone', async () => {
    const path = join(dir, 'Dockerfile');
    await fs.writeFile(path, 'FROM node:20');
    const before = (await fs.stat(path)).mtimeMs;

    expect(await writeBuildFile(path, 'FROM node:20')).toBe('unchanged');
    expect((await fs.stat(path)).mtimeMs).toBe(before);
    await expect(fs.access(`${path}.prev`)).rejects.toThrow();
  });

  it('keeps the previous content as .prev when the content changes', async () => {
    const path = join(dir, 'docker-compose.yml');
    await fs.writeFile(path, 'old');

    expect(await writeBuildFile(path, 'new')).toBe('updated');
    expect(await fs.readFile(path, 'utf8')).toBe('new');
    expect(await fs.readFile(`${path}.prev`, 'utf8')).toBe('old');
  });

  it('describes the outcome without file content', () => {
    expect(describeBuildFileChanges([{ file: 'Dockerfile', state: 'unchanged' }])).toBe('Build files match the container settings');
    expect(
      describeBuildFileChanges([
        { file: 'Dockerfile', state: 'updated' },
        { file: '.dockerignore', state: 'created' },
        { file: 'docker-compose.yml', state: 'unchanged' },
      ]),
    ).toBe('Build files written from the container settings: Dockerfile updated (previous kept as Dockerfile.prev), .dockerignore created');
  });

  it('is off unless the instance enables it explicitly', () => {
    expect(isBuildFileRefreshEnabled(undefined)).toBe(false);
    expect(isBuildFileRefreshEnabled('')).toBe(false);
    expect(isBuildFileRefreshEnabled('1')).toBe(false);
    expect(isBuildFileRefreshEnabled('false')).toBe(false);
    expect(isBuildFileRefreshEnabled('true')).toBe(true);
    expect(isBuildFileRefreshEnabled(' TRUE ')).toBe(true);
  });
});
