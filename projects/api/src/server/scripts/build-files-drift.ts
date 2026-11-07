/**
 * Drift check before an existing instance enables NSC__REFRESH_BUILD_FILES (DEV-4068). Read-only.
 *
 *   docker exec $(docker ps -qf name=deploy-party_api) node dist/src/server/scripts/build-files-drift.js
 *
 * For every container a push builds (not draft or stopped), it renders the Dockerfile and the compose file from the
 * container settings with the code the builds use, and compares them with the files on disk. One
 * line per container says what its first build after the switch would change (see
 * build-files-drift.helper for the categories). Only keys are printed, never values.
 *
 * Exit code 0 when nothing but expected changes remain, 2 when at least one container shows other
 * drift or could not be checked: settle those before switching (README, "Build files").
 */
import { promises as fs } from 'fs';
import * as mongoose from 'mongoose';
import envConfig from '../../config.env';
import { classifyComposeDrift, classifyDockerfileDrift, FileDrift } from '../common/helpers/build-files-drift.helper';
import { renderBuildFiles } from '../common/helpers/render-build-files.helper';
import type { Container } from '../modules/container/container.model';
import { ContainerKind } from '../modules/container/enums/container-kind.enum';
import { ContainerStatus } from '../modules/container/enums/container-status.enum';
import { ContainerType } from '../modules/container/enums/container-type.enum';
import { getContainerSource } from '../modules/container/helpers/container-source.helper';

const NOT_BUILT_BY_WEBHOOK: string[] = [ContainerStatus.DRAFT, ContainerStatus.STOPPED, ContainerStatus.STOPPED_BY_SYSTEM];

async function readOrNull(path: string): Promise<string | null> {
  try {
    return await fs.readFile(path, 'utf8');
  } catch (e) {
    if (e?.code === 'ENOENT') {
      return null;
    }
    throw e;
  }
}

function format(drift: FileDrift): string {
  const detail = drift.kind === 'other' ? drift.changedKeys.join(', ') : drift.notes.join(', ');
  return `${drift.file}=${drift.kind}${detail ? ` (${detail})` : ''}`;
}

async function main(): Promise<number> {
  const connection = await mongoose.createConnection(envConfig.mongoose.uri).asPromise();
  const containers = connection.db.collection('containers');
  const registries = connection.db.collection('registries');

  const docs = await containers
    // Older containers carry only `type`, newer ones `kind` as well; renderBuildFiles uses type ?? kind.
    .find({
      $or: [
        { type: { $in: [ContainerType.NODE, ContainerType.STATIC, ContainerType.CUSTOM] } },
        { kind: { $in: [ContainerKind.APPLICATION, ContainerKind.CUSTOM] } },
      ],
    })
    .sort({ name: 1 })
    .toArray();

  const totals = { expected: 0, failed: 0, other: 0, skipped: 0, unchanged: 0 };

  for (const doc of docs) {
    // The webhook never builds these (webhook.controller), and a deploy from the UI writes the
    // build files already today, so the switch changes nothing for them.
    if (NOT_BUILT_BY_WEBHOOK.includes(doc.status)) {
      totals.skipped++;
      continue;
    }

    const container = { ...doc, id: String(doc._id) } as unknown as Container;
    if (doc.registry) {
      const registry = await registries.findOne({ _id: doc.registry });
      (container as any).registry = registry ? { ...registry, id: String(registry._id) } : null;
    }

    const label = `${container.id} ${JSON.stringify(container.name ?? '')} [${container.type ?? container.kind}, ${container.status}]`;
    try {
      // Same folder as DockerService.getPath.
      const source = getContainerSource(container, true);
      const folder = `${envConfig.projectsDir}/${container.id}${source ? `/${source}` : ''}`;
      const rendered = await renderBuildFiles(container);
      const results: FileDrift[] = [];

      if (rendered.dockerfile) {
        results.push(classifyDockerfileDrift(await readOrNull(`${folder}/Dockerfile`), rendered.dockerfile));
      }
      if (rendered.compose) {
        const custom = (container.type ?? container.kind) === ContainerType.CUSTOM;
        results.push(classifyComposeDrift(await readOrNull(`${folder}/docker-compose.yml`), rendered.compose, custom));
      }

      const worst = results.some((r) => r.kind === 'other')
        ? 'other'
        : results.some((r) => r.kind === 'expected' || r.kind === 'missing')
          ? 'expected'
          : 'unchanged';
      totals[worst]++;
      console.log(`${worst.toUpperCase().padEnd(9)} ${label} ${results.map(format).join(' ') || 'nothing to render'}`);
    } catch (e) {
      totals.failed++;
      console.log(`FAILED    ${label} ${e?.message ?? String(e)}`);
    }
  }

  console.log(
    `\n${docs.length} containers: ${totals.unchanged} unchanged, ${totals.expected} expected, ${totals.other} other, ${totals.failed} failed, ${totals.skipped} skipped (draft or stopped: not built by a push)`,
  );
  await connection.close();
  return totals.other || totals.failed ? 2 : 0;
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    console.error(e?.message ?? String(e));
    process.exit(1);
  });
