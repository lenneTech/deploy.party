import {Container} from "../../../container.model";

export function getAdminer(container: Container): string {
  return `
    version: "3.8"

    networks:
      traefik-public:
        external: true
      deploy-party:
        external: true

    services:
      adminer:
        image: dockette/adminer:full
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
          - traefik.http.routers.${container.id}-app-http.rule=Host(\`${container.url}\`, \`www.${container.url}\`)
          - traefik.http.routers.${container.id}-app-http.entrypoints=http
          - traefik.http.routers.${container.id}-app-http.middlewares=https-redirect
          - traefik.http.routers.${container.id}-app-https.rule=Host(\`${container.url}\`, \`www.${container.url}\`)
          - traefik.http.routers.${container.id}-app-https.entrypoints=https
          - traefik.http.routers.${container.id}-app-https.tls=true
          - traefik.http.routers.${container.id}-app-https.tls.certresolver=le
          - traefik.http.middlewares.${container.id}-redirect.redirectregex.regex=^https?://www.${container.url}/(.*)
          - traefik.http.middlewares.${container.id}-redirect.redirectregex.replacement=https://${container.url}/$${1}
          - traefik.http.routers.${container.id}-app-https.middlewares=${container.id}-redirect,secure-headers
          - traefik.http.middlewares.${container.id}-redirect.redirectregex.permanent=true
          - traefik.http.services.${container.id}-app.loadbalancer.server.port=8080
      `
}
