import {Container} from "../../../container.model";
import {execa} from "execa";

export async function getAdminer(container: Container): Promise<string> {
  const basicAuth = !!(container?.basicAuth?.username && container?.basicAuth?.pw);
  const additionalLabels = [];
  const middlewares = ['secure-headers'];

  if (basicAuth) {
    // Hash password
    const {stdout: creds} = await execa(
      `echo $(htpasswd -nb ${container.basicAuth.username} ${container.basicAuth.pw})`,
      {shell: true}
    );
    // Set password and replace all $ in hash with $$ for escaping
    additionalLabels.push(`        - traefik.http.middlewares.${container.id}-auth.basicauth.users=${creds.replace(/\$/ig, '$$$')}`);
    middlewares.unshift(`${container.id}-auth`);
  }

  return `
    networks:
      traefik-public:
        external: true
      deploy-party:
        external: true

    services:
      adminer:
        image: dockette/adminer:${container.buildImage || 'full'}
        labels:
          - deploy.party.id=${container.id}
        environment:
          ADMINER_DESIGN: dracula
        networks:
          - traefik-public
          - deploy-party
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
            - traefik.http.services.${container.id}-app.loadbalancer.server.port=80
      `
}
