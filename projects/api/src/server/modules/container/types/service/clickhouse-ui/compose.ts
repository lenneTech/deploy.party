import {Container} from '../../../container.model';
import {execa} from 'execa';

export async function getClickhouseUi(container: Container): Promise<string> {
  const basicAuth = !!(container?.basicAuth?.username && container?.basicAuth?.pw);
  const additionalLabels = [];
  const middlewares = ['secure-headers@swarm'];

  if (basicAuth) {
    const {stdout: creds} = await execa(
      `echo $(htpasswd -nb ${container.basicAuth.username} ${container.basicAuth.pw})`,
      {shell: true}
    );
    additionalLabels.push(`        - traefik.http.middlewares.${container.id}-auth.basicauth.users=${creds.replace(/\$/gi, '$$$')}`);
    middlewares.unshift(`${container.id}-auth`);
  }

  // Additional networks configuration
  const additionalNetworks = container.additionalNetworks || [];
  const extraNetworkDefinitions = additionalNetworks
    .map(n => `      ${n}:\n        external: true`)
    .join('\n');
  const extraNetworkConnections = additionalNetworks
    .map(n => `          - ${n}`)
    .join('\n');

  return `
    networks:
      traefik-public:
        external: true
      deploy-party:
        external: true
${extraNetworkDefinitions ? '\n' + extraNetworkDefinitions : ''}

    services:
      clickhouse-ui:
        image: ghcr.io/caioricciuti/ch-ui:${container.buildImage || 'latest'}
        labels:
          - deploy.party.id=${container.id}
        env_file:
          - .env
        networks:
          - traefik-public
          - deploy-party
${extraNetworkConnections ? extraNetworkConnections + '\n' : ''}
        deploy:
          update_config:
            order: start-first
            failure_action: rollback
            delay: 10s
          rollback_config:
            parallelism: 0
            order: stop-first
          restart_policy:
            condition: any
            delay: 5s
            max_attempts: 3
            window: 120s
          labels:
            - traefik.enable=true
            - traefik.docker.network=traefik-public
            - traefik.constraint-label=traefik-public
            - traefik.http.routers.${container.id}-app-http.rule=Host(\`${container.url}\`) || Host(\`www.${container.url}\`)
            - traefik.http.routers.${container.id}-app-http.entrypoints=http
            - traefik.http.routers.${container.id}-app-http.middlewares=https-redirect@swarm
            - traefik.http.routers.${container.id}-app-https.rule=Host(\`${container.url}\`) || Host(\`www.${container.url}\`)
            - traefik.http.routers.${container.id}-app-https.entrypoints=https
            - traefik.http.routers.${container.id}-app-https.tls=true
            - traefik.http.routers.${container.id}-app-https.tls.certresolver=le
    ${additionalLabels.join('\n')}
            - traefik.http.routers.${container.id}-app-https.middlewares=${middlewares.join(',')}
            - traefik.http.middlewares.${container.id}-redirect.redirectregex.permanent=true
            - traefik.http.services.${container.id}-app.loadbalancer.server.port=5521
      `;
}
