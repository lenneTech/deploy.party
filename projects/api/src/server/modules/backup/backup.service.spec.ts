import { chmodSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// The backup chains run inside the backed-up container via `docker exec … sh -c <script>`. These tests take the script
// the service hands to `docker exec`, run it in a local shell with stand-ins for aws, mariadb-dump and mongodump, and
// check what a container would keep in /tmp afterwards (DEV-4397) and what would reach S3.
jest.mock('child_process', () => {
  const actual = jest.requireActual('child_process');
  return {
    ...actual,
    spawn: jest.fn(() => ({ stdout: { on: jest.fn() }, stderr: { on: jest.fn() }, on: jest.fn() })),
  };
});
jest.mock('@lenne.tech/nest-server', () => ({
  ConfigService: class {},
  CrudService: class {
    constructor(options: Record<string, unknown>) {
      Object.assign(this, options);
    }
  },
  getStringIds: (value: any) => (value && typeof value === 'object' && 'id' in value ? String(value.id) : String(value)),
}));
jest.mock('@nestjs/mongoose', () => ({ InjectModel: () => () => undefined }));
jest.mock('@aws-sdk/client-s3', () => ({}));
jest.mock('execa', () => ({ execa: jest.fn() }));
jest.mock('../../../config.env', () => ({
  __esModule: true,
  default: {
    get projectsDir() {
      return process.env.DP_TEST_PROJECTS_DIR;
    },
  },
}));
jest.mock('./backup.model', () => ({ Backup: class {} }));
jest.mock('../project/project.service', () => ({ ProjectService: class {} }));
jest.mock('../container/container.service', () => ({ ContainerService: class {} }));
jest.mock('../../common/services/docker.service', () => ({ DockerService: class {} }));

import { spawn, spawnSync } from 'child_process';
import { BackupService } from './backup.service';

const STUBS: Record<string, string> = {
  // `aws s3 cp <local> <s3-uri>` copies into the fake bucket, `aws s3 ls <s3-uri>` looks there.
  aws: `#!/bin/sh
echo "aws $*" >> "$DP_TEST_S3_DIR/../aws.log"
case "$1 $2" in
  "s3 cp") [ -n "$DP_TEST_S3_FAIL" ] && exit 1; /bin/cp "$3" "$DP_TEST_S3_DIR/$(basename "$4")" ;;
  "s3 ls") [ -f "$DP_TEST_S3_DIR/$(basename "$3")" ] && echo "1 $(basename "$3")" || exit 1 ;;
esac
exit 0
`,
  'apt-get': '#!/bin/sh\nexit 0\n',
  'mariadb-dump': `#!/bin/sh
while [ $# -gt 0 ]; do [ "$1" = "-r" ] && out="$2"; shift; done
echo "-- dump" > "$out"
`,
  mongodump: `#!/bin/sh
for arg in "$@"; do case "$arg" in --out=*) out="\${arg#--out=}" ;; esac; done
mkdir -p "$out/db" && echo "{}" > "$out/db/data.bson"
`,
  // The volume chain uses GNU argument order (`cp <src> <dst> -r`), which the BSD cp on macOS rejects.
  cp: `#!/bin/sh
if [ "$3" = "-r" ]; then exec /bin/cp -R "$1" "$2"; fi
exec /bin/cp "$@"
`,
};

describe('BackupService: /tmp of the backed-up container after a backup (DEV-4397)', () => {
  let work: string;
  let s3Dir: string;
  let stubDir: string;
  let containerId: string;
  let seq = 0;

  beforeEach(() => {
    work = mkdtempSync(join(tmpdir(), 'dp-backup-spec-'));
    s3Dir = join(work, 's3');
    stubDir = join(work, 'bin');
    mkdirSync(s3Dir);
    mkdirSync(stubDir);
    for (const [name, body] of Object.entries(STUBS)) {
      writeFileSync(join(stubDir, name), body);
      chmodSync(join(stubDir, name), 0o755);
    }
    // Like a container id: it starts every file name the backup puts into /tmp.
    containerId = `dp4397spec${process.pid}x${Date.now()}x${seq++}`;
    process.env.DP_TEST_PROJECTS_DIR = join(work, 'projects');
    mkdirSync(join(work, 'projects', containerId), { recursive: true });
    writeFileSync(join(work, 'projects', containerId, '.env'), 'MYSQL_USER=u\nMYSQL_PASSWORD=p\nMYSQL_DATABASE=d\n');
    (spawn as unknown as jest.Mock).mockClear();
  });

  afterEach(() => {
    leftovers().forEach((name) => rmSync(`/tmp/${name}`, { recursive: true, force: true }));
    rmSync(work, { recursive: true, force: true });
  });

  function leftovers(): string[] {
    return readdirSync('/tmp').filter((name) => name.startsWith(containerId));
  }

  function service(container: Record<string, unknown>): BackupService {
    return new BackupService(
      {} as any,
      { updateOne: () => ({ exec: async () => undefined }) } as any,
      {} as any,
      {} as any,
      { getId: async () => 'docker-id' } as any,
      { getProjectByContainer: async () => ({ name: 'Live' }) } as any,
      { get: async () => ({ id: containerId, name: 'test', status: 'DEPLOYED', ...container }) } as any,
    );
  }

  /** The script the service handed to `docker exec <id> sh -c`. */
  function dockerExecScript(): string {
    const calls = (spawn as unknown as jest.Mock).mock.calls;
    expect(calls).toHaveLength(1);
    const [command, args] = calls[0];
    expect(command).toBe('docker');
    expect(args.slice(0, 4)).toEqual(['exec', 'docker-id', 'sh', '-c']);
    return args[4];
  }

  function runInContainer(script: string, options: { s3Fails?: boolean } = {}) {
    return spawnSync('sh', ['-c', script], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${stubDir}:${process.env.PATH}`,
        DP_TEST_S3_DIR: s3Dir,
        DP_TEST_S3_FAIL: options.s3Fails ? '1' : '',
      },
    });
  }

  function archiveEntries(): string[] {
    const [archive] = readdirSync(s3Dir);
    return spawnSync('tar', ['-tzf', join(s3Dir, archive)], { encoding: 'utf8' }).stdout.split('\n').filter(Boolean);
  }

  const s3Backup = {
    id: 'backup-id',
    key: 'key',
    secret: 'secret',
    region: 'eu-central-1',
    bucket: 'bucket',
    host: 'https://s3.example.test',
  };

  describe('MariaDB', () => {
    const run = async (options?: { s3Fails?: boolean }) => {
      await service({ kind: 'DATABASE', type: 'MARIA_DB' }).backup({ ...s3Backup, type: 'DATABASE' } as any);
      return runInContainer(dockerExecScript(), options);
    };

    it('uploads the dump to the same place in S3 and leaves nothing in /tmp', async () => {
      const result = await run();

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('File verified in S3');
      expect(result.stdout).toContain('Finished');
      const [archive] = readdirSync(s3Dir);
      expect(archive).toMatch(new RegExp(`^${containerId}-[0-9TZ-]+\\.tar\\.gz$`));
      expect(archiveEntries()).toEqual([archive.replace(/\.tar\.gz$/, '.sql')]);
      expect(readFileSync(join(work, 'aws.log'), 'utf8')).toContain(
        `s3 cp /tmp/${archive} s3://bucket/live-MARIA_DB/${archive} --region eu-central-1 --endpoint-url https://s3.example.test`,
      );
      expect(leftovers()).toEqual([]);
    });

    it('leaves nothing in /tmp when the upload fails, and the backup still fails', async () => {
      const result = await run({ s3Fails: true });

      expect(result.status).not.toBe(0);
      expect(result.stdout).toContain('S3 upload failed');
      expect(readdirSync(s3Dir)).toEqual([]);
      expect(leftovers()).toEqual([]);
    });
  });

  describe('MongoDB', () => {
    it('uploads the dump and leaves nothing in /tmp, also when the upload fails', async () => {
      await service({ kind: 'DATABASE', type: 'MONGO' }).backup({ ...s3Backup, type: 'DATABASE' } as any);
      const script = dockerExecScript();

      expect(runInContainer(script).status).toBe(0);
      expect(archiveEntries().some((entry) => entry.endsWith('/db/data.bson'))).toBe(true);
      expect(leftovers()).toEqual([]);

      rmSync(s3Dir, { recursive: true, force: true });
      mkdirSync(s3Dir);
      expect(runInContainer(script, { s3Fails: true }).status).not.toBe(0);
      expect(leftovers()).toEqual([]);
    });
  });

  describe('files (volume)', () => {
    let source: string;

    beforeEach(() => {
      source = join(work, 'fileadmin');
      mkdirSync(join(source, 'user_upload'), { recursive: true });
      writeFileSync(join(source, 'user_upload', 'image.jpg'), 'jpg');
    });

    // Legacy backups without a type on a non-database container take the volume path, as on the DWFB hosts.
    const run = async (options?: { s3Fails?: boolean }) => {
      await service({ kind: 'CUSTOM', type: 'CUSTOM' }).backup({ ...s3Backup, path: source } as any);
      return runInContainer(dockerExecScript(), options);
    };

    it('uploads the archive to the same place in S3 and leaves nothing in /tmp', async () => {
      const result = await run();

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('File verified in S3');
      const [archive] = readdirSync(s3Dir);
      const folder = archive.replace(/\.tar\.gz$/, '');
      expect(archiveEntries()).toContain(`${folder}/user_upload/image.jpg`);
      expect(readFileSync(join(work, 'aws.log'), 'utf8')).toContain(
        `s3 cp /tmp/${archive} s3://bucket/live-CUSTOM/${archive} --region eu-central-1 --endpoint-url https://s3.example.test`,
      );
      expect(leftovers()).toEqual([]);
    });

    it('leaves nothing in /tmp when the upload fails, and the backup still fails', async () => {
      const result = await run({ s3Fails: true });

      expect(result.status).not.toBe(0);
      expect(result.stdout).toContain('S3 upload failed');
      expect(leftovers()).toEqual([]);
    });
  });
});
