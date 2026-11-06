/**
 * Cloning a source repository without leaving the access token behind (DEV-4027) and without a
 * shell (DEV-4081).
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
 *
 * The clone also used to run as one shell string. The branch or tag in it can come from the webhook
 * (a release tag for containers with a tag pattern), so `v1$(…)` executed commands in the API
 * container, which holds the Docker socket. The arguments now go to git directly, and a ref outside
 * the characters git branch and tag names use in practice is rejected before git runs.
 */

export interface GitCloneOptions {
  branch: string;
  /** Repository URL as stored on the container, with or without `http(s)://`. */
  repositoryUrl: string;
  /** Absolute target directory of the clone. */
  target: string;
}

/**
 * Characters of the branch and tag names in use on every instance (inventory 06.11.2026: `main`,
 * `dev`, `test`, `develop`, `v1`, `v2`, `v1.0.0-dev.45`). Shell metacharacters, whitespace and the
 * sequences git itself forbids are not part of it.
 */
const SAFE_REF = /^[A-Za-z0-9._/+-]+$/;

/** Throws unless `ref` is a plain branch or tag name that neither a shell nor git can misread. */
export function assertSafeGitRef(ref: string): string {
  const valid =
    typeof ref === 'string' &&
    SAFE_REF.test(ref) &&
    !ref.startsWith('-') &&
    !ref.includes('..') &&
    !ref.includes('//') &&
    !ref.endsWith('.lock') &&
    !ref.endsWith('/') &&
    !ref.endsWith('.');
  if (!valid) {
    throw new Error(`Invalid branch or tag name: ${JSON.stringify(ref)}`);
  }
  return ref;
}

/**
 * Arguments for `git clone`, free of credentials, for `execa('git', args)` without a shell. Always
 * clones over https, as before. `--` ends the options, so neither the URL nor the target can turn
 * into one.
 */
export function buildGitCloneArgs({ branch, repositoryUrl, target }: GitCloneOptions): string[] {
  const url = repositoryUrl.replace(/^https?:\/\//, '');
  return ['clone', '-b', assertSafeGitRef(branch), '--', `https://${url}`, target];
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
