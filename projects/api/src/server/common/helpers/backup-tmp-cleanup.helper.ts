/**
 * Only plain names directly in /tmp: the backups name their files `<container id>-<timestamp>[.sql|.tar.gz]`.
 * Anything else (an empty name, a subpath, a glob, whitespace, shell syntax) is refused, so a broken file name can
 * never turn the cleanup into `rm -rf /tmp/` or worse.
 */
const PLAIN_TMP_PATH = /^\/tmp\/[A-Za-z0-9][A-Za-z0-9._-]*$/;

/**
 * Appends the cleanup of a backup's working files to its shell chain (DEV-4397).
 *
 * A backup runs as one `&&` chain inside the backed-up container (`docker exec <id> sh -c <script>`) and stages its
 * files in /tmp there: the dump or the copy of the folder, then the .tar.gz that goes to S3. Nothing removed them
 * reliably: the file backup had no cleanup at all, the MariaDB backup removed `/tmp/<name>` instead of the dump
 * `/tmp/<name>.sql`, and a failing upload ends the chain before any cleanup at its end. The files stayed until the
 * container restarted, on the DWFB hosts about 10 GB per night and site.
 *
 * The cleanup therefore runs after the chain, not inside it: whether the chain succeeded or not. The script still
 * exits with the chain's exit code, so a failed backup stays a failed backup.
 */
export function withTmpCleanup(chain: string, tmpPaths: string[]): string {
  if (!chain.trim() || !tmpPaths.length) {
    return chain;
  }
  for (const path of tmpPaths) {
    if (!PLAIN_TMP_PATH.test(path)) {
      throw new Error(`Refusing to clean up ${JSON.stringify(path)}: only names directly in /tmp are removed`);
    }
  }
  return `${chain}; rc=$?; rm -rf ${tmpPaths.join(' ')}; exit $rc`;
}
