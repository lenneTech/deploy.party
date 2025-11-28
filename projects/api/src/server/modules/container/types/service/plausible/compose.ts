import { Container } from "../../../container.model";

export function getPlausible(container: Container): string {
  return `
networks:
  traefik-public:
    external: true
  deploy-party:
    external: true
  plausible-internal:
    driver: overlay

services:
  postgres:
    image: postgres:16-alpine
    volumes:
      - plausibleDb:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: plausible
      POSTGRES_PASSWORD: plausible
      POSTGRES_DB: plausible
    networks:
      - plausible-internal
    deploy:
      restart_policy:
        condition: any
        max_attempts: 3
        window: 120s

  clickhouse:
    image: clickhouse/clickhouse-server:24-alpine
    volumes:
      - clickhouseData:/var/lib/clickhouse
      - clickhouseLogs:/var/log/clickhouse-server
    ulimits:
      nofile:
        soft: 262144
        hard: 262144
    networks:
      - plausible-internal
    deploy:
      restart_policy:
        condition: any
        max_attempts: 3
        window: 120s

  plausible:
    image: ghcr.io/plausible/community-edition:${container.buildImage || 'latest'}
    depends_on:
      - postgres
      - clickhouse
    env_file:
      - .env
    networks:
      - traefik-public
      - plausible-internal
      - deploy-party
    labels:
      - deploy.party.id=${container.id}
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
        max_attempts: 3
        window: 120s
      labels:
        - deploy.party.id=${container.id}
        - traefik.enable=true
        - traefik.docker.network=traefik-public
        - traefik.constraint-label=traefik-public
        - traefik.http.routers.${container.id}-http.rule=Host(\`${container.url}\`)
        - traefik.http.routers.${container.id}-http.entrypoints=http
        - traefik.http.routers.${container.id}-http.middlewares=https-redirect@swarm
        - traefik.http.routers.${container.id}-https.rule=Host(\`${container.url}\`)
        - traefik.http.routers.${container.id}-https.entrypoints=https
        - traefik.http.routers.${container.id}-https.tls=true
        - traefik.http.routers.${container.id}-https.tls.certresolver=le
        - traefik.http.services.${container.id}.loadbalancer.server.port=8000

volumes:
  plausibleDb:
  clickhouseData:
  clickhouseLogs:
  `;
}
