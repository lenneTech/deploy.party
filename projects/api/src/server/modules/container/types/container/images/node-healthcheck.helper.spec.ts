import { spawnSync } from 'child_process';
import { AddressInfo, createServer, Server } from 'net';
import { buildNodeHealthcheck } from './node-healthcheck.helper';
import { getNodeImage } from './node';

/**
 * DEV-4068: a NODE container without a healthcheck counts as running as soon as its process starts,
 * so a version that crashes on start replaced the old one and took the stage down. Every NODE
 * container now gets a healthcheck; a TCP check on its port when it has no `healthCheckCmd`.
 */
describe('NODE healthcheck', () => {
  /** Runs the exec-form command of a HEALTHCHECK line the way Docker would, without a shell. */
  function runHealthcheck(line: string): number {
    const [command, ...args] = JSON.parse(line.slice(line.indexOf('CMD ') + 4)) as string[];
    expect(command).toBe('node');
    return spawnSync(process.execPath, args, { timeout: 10000 }).status;
  }

  it('keeps an own healthCheckCmd unchanged', () => {
    expect(buildNodeHealthcheck({ healthCheckCmd: 'curl -f http://localhost:3000/health', port: '3000' })).toBe(
      'HEALTHCHECK --interval=5s --retries=60 CMD curl -f http://localhost:3000/health || exit 1',
    );
  });

  it('adds a TCP check on the port with the same interval and retries when no healthCheckCmd is set', () => {
    const line = buildNodeHealthcheck({ port: '3000' });

    expect(line).toBe(
      `HEALTHCHECK --interval=5s --retries=60 CMD ["node","-e","require('net').connect(3000,'127.0.0.1')` +
        `.on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))"]`,
    );
  });

  it('accepts the port as number and as string with surrounding whitespace', () => {
    expect(buildNodeHealthcheck({ port: 3001 })).toContain("connect(3001,'127.0.0.1')");
    expect(buildNodeHealthcheck({ port: ' 8080 ' })).toContain("connect(8080,'127.0.0.1')");
  });

  it('adds no healthcheck when the port is missing or not a plain port number', () => {
    for (const port of [undefined, '', '0', '65536', '3000; rm -rf /', '3000/tcp', '30.5', 'abc', '-1']) {
      expect(buildNodeHealthcheck({ port })).toBeNull();
    }
  });

  describe('the generated command', () => {
    let server: Server;
    let openPort: number;

    beforeAll(async () => {
      server = createServer((socket) => socket.end());
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
      openPort = (server.address() as AddressInfo).port;
    });

    afterAll(async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    });

    it('exits 0 while something listens on the port', () => {
      expect(runHealthcheck(buildNodeHealthcheck({ port: openPort }))).toBe(0);
    });

    it('exits 1 when nothing listens on the port', async () => {
      // Take a free port and release it again, so that nothing listens there.
      const probe = createServer();
      await new Promise<void>((resolve) => probe.listen(0, '127.0.0.1', resolve));
      const closedPort = (probe.address() as AddressInfo).port;
      await new Promise<void>((resolve) => probe.close(() => resolve()));

      expect(runHealthcheck(buildNodeHealthcheck({ port: closedPort }))).toBe(1);
    });
  });

  describe('in the NODE Dockerfile', () => {
    const base = { buildImage: 'node:20-alpine', id: 'abc', port: '3000', startCmd: 'npm run start' } as any;

    it('contains the TCP check when no healthCheckCmd is set', async () => {
      const dockerfile = await getNodeImage(base);

      expect(dockerfile).toContain(`HEALTHCHECK --interval=5s --retries=60 CMD ["node","-e","require('net').connect(3000,`);
      // The healthcheck stays in front of EXPOSE and CMD, where the healthCheckCmd line has always been.
      expect(dockerfile.indexOf('HEALTHCHECK')).toBeLessThan(dockerfile.indexOf('EXPOSE 3000'));
    });

    it('contains the own healthCheckCmd and no second healthcheck', async () => {
      const dockerfile = await getNodeImage({ ...base, healthCheckCmd: 'wget -q -O- http://127.0.0.1:3000/ready' });

      expect(dockerfile).toContain('HEALTHCHECK --interval=5s --retries=60 CMD wget -q -O- http://127.0.0.1:3000/ready || exit 1');
      expect(dockerfile.match(/HEALTHCHECK/g)).toHaveLength(1);
    });
  });
});
