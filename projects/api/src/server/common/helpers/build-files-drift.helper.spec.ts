import { classifyComposeDrift, classifyDockerfileDrift } from './build-files-drift.helper';
import { addCustomComposeUpdateDefaults } from './custom-compose-update-config.helper';

/**
 * DEV-4068: the drift check decides whether an instance may switch on NSC__REFRESH_BUILD_FILES.
 * It must tell the expected additions from real drift, and it must never print a value.
 */
describe('build file drift', () => {
  const dockerfile = ['FROM node:20', 'WORKDIR /app', 'COPY ./code/. ./', 'RUN npm ci', 'RUN rm -rf .git', 'EXPOSE 3000', 'CMD node .output/server/index.mjs'].join('\n');
  const withHealthcheck = dockerfile.replace('EXPOSE 3000', 'HEALTHCHECK --interval=5s --retries=60 CMD ["node","-e","x"]\nEXPOSE 3000');

  describe('Dockerfile', () => {
    it('reports identical files as unchanged, ignoring trailing whitespace', () => {
      expect(classifyDockerfileDrift(`${dockerfile}\n`, dockerfile).kind).toBe('unchanged');
    });

    it('reports a missing file', () => {
      expect(classifyDockerfileDrift(null, dockerfile).kind).toBe('missing');
    });

    it('accepts an added or changed healthcheck as expected', () => {
      expect(classifyDockerfileDrift(dockerfile, withHealthcheck)).toMatchObject({ kind: 'expected', notes: ['healthcheck added'] });
      const old = withHealthcheck.replace('CMD ["node","-e","x"]', 'CMD curl -f localhost || exit 1');
      expect(classifyDockerfileDrift(old, withHealthcheck)).toMatchObject({ kind: 'expected', notes: ['healthcheck changed'] });
    });

    it('ignores a trailing newline next to an added healthcheck', () => {
      expect(classifyDockerfileDrift(`${dockerfile}\n`, withHealthcheck).kind).toBe('expected');
    });

    it('reports lines that only moved', () => {
      const moved = dockerfile.replace('RUN npm ci\nRUN rm -rf .git', 'RUN rm -rf .git\nRUN npm ci');
      expect(classifyDockerfileDrift(dockerfile, moved)).toMatchObject({ changedKeys: ['<line order>'], kind: 'other' });
    });

    it('reports other changes with their instruction, without commands or values', () => {
      const changed = withHealthcheck.replace('RUN npm ci', 'RUN npm ci --token=SECRET').replace('WORKDIR /app', 'WORKDIR /app\nENV API_KEY=SECRET');
      const drift = classifyDockerfileDrift(dockerfile, changed);

      expect(drift.kind).toBe('other');
      expect(drift.changedKeys).toEqual(['+ENV API_KEY', '+HEALTHCHECK', '+RUN', '-RUN']);
      expect(JSON.stringify(drift)).not.toContain('SECRET');
    });
  });

  describe('compose', () => {
    const node = [
      'services:',
      '  app:',
      '    deploy:',
      '      labels:',
      '        - traefik.http.middlewares.c1-auth.basicauth.users=team:$$apr1$$abc$$def',
      '        - traefik.http.routers.c1-https.rule=Host(`a.example.com`)',
    ].join('\n');

    it('accepts a basic-auth label in the new hash format as expected', () => {
      const rendered = node.replace('$$apr1$$abc$$def', '$$2b$$10$$xyz');
      expect(classifyComposeDrift(node, rendered, false)).toMatchObject({ kind: 'expected', notes: ['basic-auth label in the new hash format'] });
    });

    it('accepts passhostheader=true written out, since it is the Traefik default', () => {
      const rendered = `${node}\n        - traefik.http.services.c1.loadbalancer.passhostheader=true`;
      expect(classifyComposeDrift(node, rendered, false)).toMatchObject({
        kind: 'expected',
        notes: ['passhostheader=true written out (the Traefik default)'],
      });
    });

    it('reports passhostheader=false as other drift', () => {
      const rendered = `${node}\n        - traefik.http.services.c1.loadbalancer.passhostheader=false`;
      expect(classifyComposeDrift(node, rendered, false)).toMatchObject({
        changedKeys: ['+traefik.http.services.c1.loadbalancer.passhostheader'],
        kind: 'other',
      });
    });

    it('reports a changed route as other drift, by key only', () => {
      const rendered = node.replace('a.example.com', 'b.example.com');
      const drift = classifyComposeDrift(node, rendered, false);

      expect(drift).toMatchObject({ changedKeys: ['+traefik.http.routers.c1-https.rule', '-traefik.http.routers.c1-https.rule'], kind: 'other' });
      expect(JSON.stringify(drift)).not.toContain('example.com');
    });

    it('accepts the update and rollback settings deploy.party adds to a custom compose', () => {
      const custom = ['version: "3.8"', 'services:', '  db:', '    image: mongo:7', '    environment:', '      - MONGO_PASSWORD=SECRET'].join('\n');
      expect(classifyComposeDrift(custom, addCustomComposeUpdateDefaults(custom), true)).toMatchObject({
        kind: 'expected',
        notes: ['update and rollback settings added'],
      });
    });

    it('reports a changed custom compose without its values', () => {
      const custom = ['version: "3.8"', 'services:', '  db:', '    image: mongo:7', '    environment:', '      - MONGO_PASSWORD=SECRET'].join('\n');
      const drift = classifyComposeDrift(custom, addCustomComposeUpdateDefaults(custom.replace('SECRET', 'OTHER')), true);

      expect(drift.kind).toBe('other');
      expect(drift.changedKeys).toEqual(['+MONGO_PASSWORD', '-MONGO_PASSWORD']);
      expect(JSON.stringify(drift)).not.toMatch(/SECRET|OTHER/);
    });
  });
});
