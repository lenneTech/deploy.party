import { buildGitCloneArgs, buildGitCredentialEnv } from './git-clone.helper';

/**
 * DEV-4027: the clone token must never end up in the cloned repository.
 *
 * deploy.party used to clone `https://gitlab-ci-token:<token>@host/repo`. Git stores that URL in
 * `.git/config`, the Dockerfile templates copy `.git` into the image, and the registry served the
 * image. That is how a token leaked from an open registry on 05.11.2026. The token now travels as
 * an HTTP header through environment variables: it is neither part of the URL nor of the command.
 *
 * DEV-4081: the clone runs without a shell. A tag name arrives through the (until then unauthenticated)
 * webhook, and `git clone -b <tag>` inside a shell string executed whatever the tag carried.
 */
describe('git clone without the token in the URL and without a shell', () => {
  const token = 'glpat-secret-token-value';

  it('builds clone arguments that contain no credentials', () => {
    const args = buildGitCloneArgs({
      branch: 'main',
      repositoryUrl: 'https://gitlab.example.com/group/repo.git',
      target: '/data/projects/abc/code',
    });

    expect(args).toEqual(['clone', '-b', 'main', '--', 'https://gitlab.example.com/group/repo.git', '/data/projects/abc/code']);
    expect(args.join(' ')).not.toContain('@');
    expect(args.join(' ')).not.toContain(token);
  });

  it('keeps accepting repository URLs without a scheme or with http', () => {
    expect(buildGitCloneArgs({ branch: 'dev', repositoryUrl: 'gitlab.example.com/a/b', target: '/x' })[4]).toBe(
      'https://gitlab.example.com/a/b',
    );
    expect(buildGitCloneArgs({ branch: 'dev', repositoryUrl: 'http://gitlab.example.com/a/b', target: '/x' })[4]).toBe(
      'https://gitlab.example.com/a/b',
    );
  });

  it('accepts every branch and tag name in use on the instances (inventory 06.11.2026)', () => {
    for (const ref of ['main', 'dev', 'test', 'develop', 'v1', 'v2', 'v1.0.0-dev.45', 'hotfix/dev-4054-plausible-main', 'release+1']) {
      expect(buildGitCloneArgs({ branch: ref, repositoryUrl: 'gitlab.example.com/a/b', target: '/x' })[2]).toBe(ref);
    }
  });

  it('rejects branch and tag names that a shell or git would read as something else', () => {
    for (const ref of ['v1$(id)', 'main; rm -rf /', 'main && curl x', '`id`', 'a|b', 'a b', '-x', '--upload-pack=x', 'a..b', 'a//b', 'x.lock', 'x/', 'x.', '']) {
      expect(() => buildGitCloneArgs({ branch: ref, repositoryUrl: 'gitlab.example.com/a/b', target: '/x' })).toThrow(
        'Invalid branch or tag name',
      );
    }
  });

  it('passes the token as a basic-auth header with the same user name as before', () => {
    const env = buildGitCredentialEnv(token);
    const expected = Buffer.from(`gitlab-ci-token:${token}`).toString('base64');

    expect(env).toEqual({
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: 'http.extraHeader',
      GIT_CONFIG_VALUE_0: `Authorization: Basic ${expected}`,
      GIT_TERMINAL_PROMPT: '0',
    });
  });

  it('never prompts for credentials, so a wrong token fails the build instead of hanging it', () => {
    expect(buildGitCredentialEnv(token).GIT_TERMINAL_PROMPT).toBe('0');
  });
});
