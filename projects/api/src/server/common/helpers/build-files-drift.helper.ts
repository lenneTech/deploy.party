import { addCustomComposeUpdateDefaults } from './custom-compose-update-config.helper';

/**
 * Drift between the build files on disk and the ones deploy.party renders from the container
 * settings (DEV-4068). Before an existing instance enables NSC__REFRESH_BUILD_FILES, the drift check
 * shows what the first build of every container would change:
 *
 * - `unchanged`: the files are identical, the build changes nothing.
 * - `expected`: only what DEV-4068 adds (healthcheck, update and rollback settings) or a basic-auth
 *   label in the new hash format. Safe.
 * - `other`: anything else. Settings that were changed but never deployed, a file edited by hand on
 *   the server, or an older template. Each of these is settled before the instance is switched.
 * - `missing`: there is no file on disk yet.
 *
 * Only keys are reported, never values: compose files and Dockerfiles can hold passwords.
 */
export type DriftKind = 'expected' | 'missing' | 'other' | 'unchanged';

export interface FileDrift {
  /** Keys of the lines that differ (`other` only), without values: `+key` added, `-key` removed. */
  changedKeys: string[];
  file: string;
  kind: DriftKind;
  /** What made an `expected` drift expected. */
  notes: string[];
}

export function classifyDockerfileDrift(disk: string | null, rendered: string): FileDrift {
  if (disk === null) {
    return { changedKeys: [], file: 'Dockerfile', kind: 'missing', notes: [] };
  }
  if (normalizeNewlines(disk) === normalizeNewlines(rendered)) {
    return { changedKeys: [], file: 'Dockerfile', kind: 'unchanged', notes: [] };
  }

  const withoutHealthcheck = (text: string) =>
    lines(text)
      .filter((line) => !/^HEALTHCHECK\s/i.test(line.trim()))
      .join('\n')
      .trim();
  if (withoutHealthcheck(disk) === withoutHealthcheck(rendered)) {
    const note = /^HEALTHCHECK\s/im.test(disk) ? 'healthcheck changed' : 'healthcheck added';
    return { changedKeys: [], file: 'Dockerfile', kind: 'expected', notes: [note] };
  }

  return { changedKeys: withOrderNote(changedKeys(disk, rendered, dockerfileKey)), file: 'Dockerfile', kind: 'other', notes: [] };
}

export function classifyComposeDrift(disk: string | null, rendered: string, custom: boolean): FileDrift {
  const file = 'docker-compose.yml';
  if (disk === null) {
    return { changedKeys: [], file, kind: 'missing', notes: [] };
  }
  if (normalizeNewlines(disk) === normalizeNewlines(rendered)) {
    return { changedKeys: [], file, kind: 'unchanged', notes: [] };
  }

  const notes: string[] = [];
  let expected = disk;
  if (custom) {
    const withDefaults = addCustomComposeUpdateDefaults(disk);
    if (withDefaults !== disk) {
      notes.push('update and rollback settings added');
      expected = withDefaults;
    }
  }

  if (normalizeNewlines(normalizeCompose(expected)) === normalizeNewlines(normalizeCompose(rendered))) {
    if (normalizeNewlines(maskBasicAuth(expected)) !== normalizeNewlines(maskBasicAuth(rendered))) {
      notes.push('passhostheader=true written out (the Traefik default)');
    }
    if (normalizeNewlines(withoutDefaultPassHostHeader(expected)) !== normalizeNewlines(withoutDefaultPassHostHeader(rendered))) {
      notes.push('basic-auth label in the new hash format');
    }
    return { changedKeys: [], file, kind: 'expected', notes };
  }

  return {
    changedKeys: withOrderNote(changedKeys(normalizeCompose(expected), normalizeCompose(rendered), composeKey)),
    file,
    kind: 'other',
    notes: [],
  };
}

/** Same lines in another order leave no differing line; say so instead of reporting nothing. */
function withOrderNote(keys: string[]): string[] {
  return keys.length ? keys : ['<line order>'];
}

/** Differences that change nothing at runtime: the basic-auth hash and Traefik's own default. */
function normalizeCompose(text: string): string {
  return withoutDefaultPassHostHeader(maskBasicAuth(text));
}

/** `passhostheader=true` is what Traefik does without the label; newer templates write it out. */
function withoutDefaultPassHostHeader(text: string): string {
  return lines(text)
    .filter((line) => !/loadbalancer\.passhostheader=true$/i.test(line.trim()))
    .join('\n');
}

function maskBasicAuth(text: string): string {
  return text.replace(/(basicauth\.users=)\S+/gi, '$1<hash>');
}

function normalizeNewlines(text: string): string {
  return lines(text).join('\n').trim();
}

function lines(text: string): string[] {
  return text.replace(/\r\n/g, '\n').split('\n').map((line) => line.replace(/\s+$/, ''));
}

/** Keys of the lines that are in one text but not the other (multiset difference), unique, signed. */
function changedKeys(a: string, b: string, keyOf: (line: string) => string): string[] {
  const count = new Map<string, number>();
  for (const line of lines(a)) {
    count.set(line, (count.get(line) ?? 0) + 1);
  }
  for (const line of lines(b)) {
    count.set(line, (count.get(line) ?? 0) - 1);
  }

  // `+` the first build would add the line, `-` it would remove it; a changed value shows as both.
  const keys = new Set<string>();
  for (const [line, n] of count) {
    if (n !== 0 && line.trim()) {
      keys.add(`${n < 0 ? '+' : '-'}${keyOf(line)}`);
    }
  }
  return [...keys].sort((x, y) => x.slice(1).localeCompare(y.slice(1)) || (x[0] === '+' ? -1 : 1));
}

/** Instruction keyword; for ENV, ARG and LABEL also the variable name. Never a value or a command. */
function dockerfileKey(line: string): string {
  const [instruction, rest = ''] = line.trim().split(/\s+(.*)/s);
  const upper = instruction.toUpperCase();
  if (['ARG', 'ENV', 'LABEL'].includes(upper)) {
    return `${upper} ${rest.split(/[=\s]/)[0]}`;
  }
  return upper;
}

/** The part of a compose line before `=` or `:`, without the list dash; `<value>` when there is none. */
function composeKey(line: string): string {
  const text = line.trim().replace(/^-\s*/, '').replace(/^["']/, '');
  const match = /^([^=:\s]+)\s*[=:]/.exec(text);
  return (match ? match[1] : '<value>').slice(0, 100);
}
