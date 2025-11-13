import {Container} from '../../container/container.model';
import {Registry} from '../../registry/registry.model';
import {DeploymentType} from "../../container/enums/deployment-type.enum";

export function dockerCompose(container: Container) {
  const imageUrl =
    container.repositoryUrl.includes('gitlab') && (container.registry as Registry).url.includes('gitlab')
      ? container.repositoryUrl.replace(/^https?:\/\//, '').replace(/([^\/]+)/, '$1:5050')
      : `${(container.registry as Registry).url}/${container.id}`;

  const hostOnly = container.url.replace('https://', '').replace('http://', '');
  const middlewares: Array<string> = [];
  let source = container.branch;
  if (container.deploymentType === DeploymentType.TAG) {
    source = container.tag;
  }

  return `
    version: "3.8"
    networks:
        traefik-public:
            external: true
    services:
      ${container.id}:
        container_name: ${container.id}
        build:
          context: .
          dockerfile: Dockerfile
        image: ${imageUrl}:${source}
        restart: unless-stopped
          ports:
            - "${container.port}:${container.exposedPort}"
        networks:
          - traefik-public
        deploy:
          placement:
              constraints:
                  - node.labels.traefik-public.traefik-public-certificates == true
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
              window: 120s
          labels:
            - deploy-party.container.id=${container.id}
            - traefik.enable=true
            - traefik.docker.network=traefik-public
            - traefik.constraint-label=traefik-public
            - traefik.http.routers.${container.id}-http.rule=Host(\`${hostOnly}\`)${
    container.www ? ` || Host(\`www.${hostOnly}\`)` : ''
  }
            - traefik.http.routers.${container.id}-http.entrypoints=http
            - traefik.http.routers.${container.id}-http.middlewares=https-redirect@swarm
            - traefik.http.routers.${container.id}-https.rule=Host(\`${hostOnly}\`)${
    container.www ? ` || Host(\`www.${hostOnly}\`)` : ''
  }
            - traefik.http.routers.${container.id}-https.entrypoints=https
            - traefik.http.routers.${container.id}-https.tls=true
            - traefik.http.routers.${container.id}-https.tls.certresolver=le
            - traefik.http.middlewares.${container.id}-redirect.redirectregex.regex=^https?://www.${hostOnly}/(.*)
            - traefik.http.middlewares.${container.id}-redirect.redirectregex.replacement=https://${hostOnly}/$${1}
            - traefik.http.middlewares.${container.id}-redirect.redirectregex.permanent=true
            - traefik.http.middlewares.${container.id}-auth.basicauth.users=${Buffer.from(
    container.basicAuth.username + ':' + container.basicAuth.pw
  ).toString('base64')}}
            - traefik.http.routers.${container.id}-https.middlewares=${middlewares.join(',')}
            - traefik.http.services.${container.id}.loadbalancer.server.port=${container.port}
    `;
}
