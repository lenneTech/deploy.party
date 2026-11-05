/**
 * Cloning a source repository without leaving the access token behind (DEV-4027).
 *
 * The token used to sit in the clone URL (`https://gitlab-ci-token:<token>@host/repo`). Git keeps
 * that URL in `.git/config`, and `.git` is copied into every image before the template removes it in
 * a later layer, so the token stayed readable in the image. It also appeared in the build log when a
 * clone failed, because execa reports the full command.
 *
 * Now the clone URL carries no credentials. Git receives the token as an `Authorization` header via
 * `GIT_CONFIG_*` environment variables (git >= 2.31), which apply to this one process only and are
 * written nowhere. The basic-auth user name stays `gitlab-ci-token`, exactly as before, so every token
 * that worked in the URL works in the header.
 */

export interface GitCloneOptions {
  branch: string;
  /** Repository URL as stored on the container, with or without `http(s)://`. */
  repositoryUrl: string;
  /** Absolute target directory of the clone. */
  target: string;
}

/** The clone command, free of credentials. Always clones over https, as before. */
export function buildGitCloneCommand({ branch, repositoryUrl, target }: GitCloneOptions): string {
  const url = repositoryUrl.replace(/^https?:\/\//, '');
  return `git clone -b ${branch} https://${url} ${target}`;
}

/** Environment for the clone process that hands the token to git without storing it. */
export function buildGitCredentialEnv(token: string): Record<string, string> {
  const credentials = Buffer.from(`gitlab-ci-token:${token}`).toString('base64');
  return {
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: 'http.extraHeader',
    GIT_CONFIG_VALUE_0: `Authorization: Basic ${credentials}`,
    // Without a terminal git would wait for a password forever on a rejected token.
    GIT_TERMINAL_PROMPT: '0',
  };
}
