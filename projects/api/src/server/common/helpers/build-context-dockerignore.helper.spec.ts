import { getBuildContextDockerignore } from './build-context-dockerignore.helper';

/**
 * DEV-4027: the build context of every container is its project folder. Next to `code/` it holds
 * `.docker/config.json` with the credentials deploy.party pushes to external registries with. A
 * Dockerfile that copies the context root (custom Dockerfiles may) would bake them into the image.
 */
describe('build context .dockerignore', () => {
  const entries = getBuildContextDockerignore()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  it('keeps the registry credentials out of the build context', () => {
    expect(entries).toContain('.docker');
  });

  it('leaves the code untouched, so existing builds see the same files as before', () => {
    // `.git` and `.env` stay on purpose: install and build commands run before the templates delete
    // `.git`, and some builds read `.env` at build time. Excluding them could break running projects.
    expect(entries).toEqual(['.docker']);
  });
});
