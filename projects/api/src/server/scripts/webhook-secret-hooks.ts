/**
 * Puts the webhook secret of each source into the existing GitLab hooks of this instance (DEV-4068).
 *
 *   printf '%s\n' "$GITLAB_ADMIN_TOKEN" | docker exec -i $(docker ps -qf name=deploy-party_api) \
 *     node dist/src/server/scripts/webhook-secret-hooks.js --gitlab-host gitlab.example.com [--apply]
 *
 * Hooks were created before sources had a secret, so GitLab sends none. Before an instance sets
 * NSC__WEBHOOK_TOKEN_MODE=enforce, every hook that points to `${API_URL}/webhook` gets the secret of
 * the source its containers use. The GitLab token comes on stdin and needs the right to edit the
 * hooks (Maintainer on the projects, scope `api`); it is never printed and never stored.
 *
 * Without --apply nothing is changed and the script lists what it would do. Output names only
 * project ids and hook ids, never a secret.
 */
import * as mongoose from 'mongoose';
import envConfig from '../../config.env';

interface Options {
  apply: boolean;
  gitlabHost: string;
}

function parseArgs(argv: string[]): Options {
  const options: Options = { apply: false, gitlabHost: '' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--apply') {
      options.apply = true;
    } else if (argv[i] === '--gitlab-host') {
      options.gitlabHost = argv[++i] ?? '';
    }
  }
  if (!options.gitlabHost) {
    throw new Error('--gitlab-host <host> is required (the GitLab the token on stdin belongs to)');
  }
  return options;
}

async function readStdinToken(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  const token = Buffer.concat(chunks).toString('utf8').split('\n')[0].trim();
  if (!token) {
    throw new Error('No GitLab token on stdin');
  }
  return token;
}

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, '').toLowerCase();
}

async function gitlab(method: string, url: string, token: string, body?: Record<string, unknown>) {
  const response = await fetch(url, {
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json', 'PRIVATE-TOKEN': token },
    method,
  });
  return { data: response.ok ? await response.json() : null, status: response.status };
}

async function main(): Promise<number> {
  const options = parseArgs(process.argv.slice(2));
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error('API_URL is not set in the environment of the API container');
  }
  const hookUrl = normalizeUrl(`${apiUrl.startsWith('http') ? apiUrl : `https://${apiUrl}`}/webhook`);
  const token = await readStdinToken();

  const connection = await mongoose.createConnection(envConfig.mongoose.uri).asPromise();
  const sources = await connection.db
    .collection('sources')
    .find({ url: { $regex: options.gitlabHost.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } })
    .toArray();
  const containers = await connection.db
    .collection('containers')
    .find({ repositoryId: { $nin: [null, ''] }, source: { $in: sources.map((s) => s._id) } }, { projection: { repositoryId: 1, source: 1 } })
    .toArray();
  await connection.close();

  // One hook per repository; all its containers must use the same source, or the secret is ambiguous.
  const byRepository = new Map<string, Set<string>>();
  for (const container of containers) {
    const repository = String(container.repositoryId);
    if (!byRepository.has(repository)) {
      byRepository.set(repository, new Set());
    }
    byRepository.get(repository).add(String(container.source));
  }

  const totals = { ambiguous: 0, error: 0, missingSecret: 0, noHook: 0, set: 0, wouldSet: 0 };
  console.log(`Hook URL: ${hookUrl}  (${options.apply ? 'apply' : 'dry run'})`);

  for (const [repository, sourceIds] of [...byRepository].sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))) {
    if (sourceIds.size > 1) {
      totals.ambiguous++;
      console.log(`AMBIGUOUS   project ${repository}: containers use ${sourceIds.size} different sources, left alone`);
      continue;
    }

    const source = sources.find((s) => String(s._id) === [...sourceIds][0]);
    if (!source?.webhookSecret) {
      totals.missingSecret++;
      console.log(`NO-SECRET   project ${repository}: source ${source?._id} has no webhook secret yet (run the migrations first)`);
      continue;
    }

    const base = `${String(source.url).replace(/\/+$/, '').replace(/\/api\/v4$/, '')}/api/v4/projects/${encodeURIComponent(repository)}/hooks`;
    const list = await gitlab('GET', base, token);
    if (list.status !== 200 || !Array.isArray(list.data)) {
      totals.error++;
      console.log(`ERROR       project ${repository}: listing hooks returned HTTP ${list.status}`);
      continue;
    }

    const hooks = list.data.filter((hook) => normalizeUrl(String(hook.url ?? '')) === hookUrl);
    if (!hooks.length) {
      totals.noHook++;
      console.log(`NO-HOOK     project ${repository}: no hook points to this instance`);
      continue;
    }

    for (const hook of hooks) {
      if (!options.apply) {
        totals.wouldSet++;
        console.log(`WOULD-SET   project ${repository} hook ${hook.id}`);
        continue;
      }
      // Only url and token are sent; GitLab keeps every other setting of the hook.
      const update = await gitlab('PUT', `${base}/${hook.id}`, token, { token: source.webhookSecret, url: hook.url });
      if (update.status === 200) {
        totals.set++;
        console.log(`SET         project ${repository} hook ${hook.id}`);
      } else {
        totals.error++;
        console.log(`ERROR       project ${repository} hook ${hook.id}: update returned HTTP ${update.status}`);
      }
    }
  }

  console.log(
    `\n${byRepository.size} repositories: ${totals.set} set, ${totals.wouldSet} would set, ${totals.noHook} without hook, ` +
      `${totals.ambiguous} ambiguous, ${totals.missingSecret} without secret, ${totals.error} errors`,
  );
  return totals.error || totals.ambiguous || totals.missingSecret ? 2 : 0;
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    console.error(e?.message ?? String(e));
    process.exit(1);
  });
