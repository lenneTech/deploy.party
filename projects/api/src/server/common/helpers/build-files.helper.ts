import { promises as fs } from 'fs';

/**
 * Writing the build files of a container (Dockerfile, docker-compose.yml) on every build, DEV-4068.
 *
 * A build used to take the Dockerfile and the compose file that were on disk. Only a deploy from the
 * UI and a tag build wrote them again from the container settings. So a change in the settings went
 * live only after a deploy (fette-beute, 22.10.2026), and everything deploy.party adds to the files
 * (the healthcheck of NODE containers, rollback for CUSTOM containers, the .dockerignore) reached
 * existing containers only after a deploy from the UI.
 *
 * Builds now write the files from the settings, too. When the content changes, the previous file is
 * kept next to it as `<file>.prev`, so every change can be traced and undone by hand.
 */
export type BuildFileState = 'created' | 'updated' | 'unchanged';

export interface BuildFileChange {
  file: string;
  state: BuildFileState;
}

/**
 * Whether builds write the build files (`NSC__REFRESH_BUILD_FILES=true`). Off by default, so an
 * update changes nothing on its own: an existing instance enables it after the drift check
 * (`build-files-drift`) showed what the first builds would change. install.sh enables it.
 */
export function isBuildFileRefreshEnabled(value: unknown): boolean {
  return String(value ?? '').trim().toLowerCase() === 'true';
}

/** Writes `content` to `path` unless the file already holds exactly that; keeps the old file as `.prev`. */
export async function writeBuildFile(path: string, content: string): Promise<BuildFileState> {
  let current: string | null = null;
  try {
    current = await fs.readFile(path, 'utf8');
  } catch (e) {
    if (e?.code !== 'ENOENT') {
      throw e;
    }
  }

  if (current === content) {
    return 'unchanged';
  }

  if (current !== null) {
    await fs.writeFile(`${path}.prev`, current);
  }
  await fs.writeFile(path, content);
  return current === null ? 'created' : 'updated';
}

/** One build-log line for the outcome, without any file content. */
export function describeBuildFileChanges(changes: BuildFileChange[]): string {
  const updated = changes.filter((change) => change.state !== 'unchanged');
  if (!updated.length) {
    return 'Build files match the container settings';
  }

  return `Build files written from the container settings: ${updated
    .map((change) => `${change.file} ${change.state}${change.state === 'updated' ? ` (previous kept as ${change.file}.prev)` : ''}`)
    .join(', ')}`;
}
