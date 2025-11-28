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
      POSTGRES_PASSWORD: postgres
    networks:
      - plausible-internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      start_period: 1m
    deploy:
      restart_policy:
        condition: any
        max_attempts: 3
        window: 120s

  clickhouse:
    image: clickhouse/clickhouse-server:24.12-alpine
    volumes:
      - clickhouseData:/var/lib/clickhouse
      - clickhouseLogs:/var/log/clickhouse-server
      - ./plausible-ce/clickhouse/logs.xml:/etc/clickhouse-server/config.d/logs.xml:ro
      - ./plausible-ce/clickhouse/ipv4-only.xml:/etc/clickhouse-server/config.d/ipv4-only.xml:ro
      - ./plausible-ce/clickhouse/low-resources.xml:/etc/clickhouse-server/config.d/low-resources.xml:ro
    environment:
      CLICKHOUSE_SKIP_USER_SETUP: "1"
    ulimits:
      nofile:
        soft: 262144
        hard: 262144
    networks:
      - plausible-internal
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:8123/ping || exit 1"]
      start_period: 1m
    deploy:
      restart_policy:
        condition: any
        max_attempts: 3
        window: 120s

  plausible:
    image: ghcr.io/plausible/community-edition:${container.buildImage || 'v3.1.0'}
    command: sh -c "sleep 10 && /app/bin/plausible eval Plausible.Release.setup_clickhouse && /app/bin/plausible eval Plausible.Release.migrate && /app/bin/plausible start"
    depends_on:
      - postgres
      - clickhouse
    volumes:
      - plausibleData:/var/lib/plausible
    env_file:
      - .env
    ulimits:
      nofile:
        soft: 65535
        hard: 65535
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
  plausibleData:
  clickhouseData:
  clickhouseLogs:
  `;
}
