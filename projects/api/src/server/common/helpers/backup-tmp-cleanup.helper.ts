/**
 * Only plain names directly in /tmp: the backups name their files `<container id>-<timestamp>[.sql|.tar.gz]`.
 * Anything else (an empty name, a subpath, a glob, whitespace, shell syntax) is refused, so a broken file name can
 * never turn the cleanup into `rm -rf /tmp/` or worse.
 */
const PLAIN_TMP_PATH = /^\/tmp\/[A-Za-z0-9][A-Za-z0-9._-]*$/;

/** Working files of one backup in /tmp of the container. */
export interface BackupTmpFiles {
  /** The dump or the copy of the folder: only needed to build the archive. */
  staging: string[];
  /** The .tar.gz that goes to S3: the backup itself. */
  archive: string;
}

/**
 * Appends the cleanup of a backup's working files to its shell chain (DEV-4397).
 *
 * A backup runs as one `&&` chain inside the backed-up container (`docker exec <id> sh -c <script>`) and stages its
 * files in /tmp there: the dump or the copy of the folder, then the .tar.gz that goes to S3. Nothing removed them
 * reliably: the file backup had no cleanup at all, the MariaDB backup removed `/tmp/<name>` instead of the dump
 * `/tmp/<name>.sql`, and a failing upload ends the chain before any cleanup at its end. The files stayed until the
 * container restarted, on the DWFB hosts about 10 GB per night and site.
 *
 * The cleanup therefore runs after the chain, not inside it:
 * - The staging files are always removed.
 * - The archive is removed once the chain succeeded, that is after `aws s3 cp` and the `aws s3 ls` check.
 * - When the chain failed, a complete archive stays in /tmp and the log says where, so the backup of that night is
 *   not lost. An archive that does not read back (packing failed, e.g. on a full disk) is no backup and is removed.
 * The script exits with the chain's exit code, so a failed backup stays a failed backup.
 */
export function withTmpCleanup(chain: string, files: BackupTmpFiles | undefined): string {
  if (!chain.trim() || !files) {
    return chain;
  }
  for (const path of [...files.staging, files.archive]) {
    if (!PLAIN_TMP_PATH.test(path)) {
      throw new Error(`Refusing to clean up ${JSON.stringify(path)}: only names directly in /tmp are removed`);
    }
  }
  const archive = files.archive;
  const staging = files.staging.length ? `rm -rf ${files.staging.join(' ')}; ` : '';
  return (
    `${chain}; rc=$?; ${staging}` +
    `if [ $rc -eq 0 ]; then rm -f ${archive}; ` +
    `elif [ -f ${archive} ] && tar -tzf ${archive} >/dev/null 2>&1; then echo 'Backup not in S3, archive kept: ${archive}'; ` +
    `else rm -f ${archive}; fi; exit $rc`
  );
}
