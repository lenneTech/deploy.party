import { buildGitCloneCommand, buildGitCredentialEnv } from './git-clone.helper';

/**
 * DEV-4027: the clone token must never end up in the cloned repository.
 *
 * deploy.party used to clone `https://gitlab-ci-token:<token>@host/repo`. Git stores that URL in
 * `.git/config`, the Dockerfile templates copy `.git` into the image, and the registry served the
 * image. That is how a token leaked from an open registry on 05.11.2026. The token now travels as
 * an HTTP header through environment variables: it is neither part of the URL nor of the command.
 */
describe('git clone without the token in the URL', () => {
  const token = 'glpat-secret-token-value';

  it('builds a clone command that contains no credentials', () => {
    const command = buildGitCloneCommand({
      branch: 'main',
      repositoryUrl: 'https://gitlab.example.com/group/repo.git',
      target: '/data/projects/abc/code',
    });

    expect(command).toBe('git clone -b main https://gitlab.example.com/group/repo.git /data/projects/abc/code');
    expect(command).not.toContain('@');
    expect(command).not.toContain(token);
  });

  it('keeps accepting repository URLs without a scheme or with http', () => {
    expect(buildGitCloneCommand({ branch: 'dev', repositoryUrl: 'gitlab.example.com/a/b', target: '/x' })).toBe(
      'git clone -b dev https://gitlab.example.com/a/b /x',
    );
    expect(buildGitCloneCommand({ branch: 'dev', repositoryUrl: 'http://gitlab.example.com/a/b', target: '/x' })).toBe(
      'git clone -b dev https://gitlab.example.com/a/b /x',
    );
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
