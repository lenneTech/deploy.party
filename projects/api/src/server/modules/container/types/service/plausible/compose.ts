import { Container } from "../../../container.model";

export function getPlausible(container: Container, basePath: string): string {
  // Additional networks configuration
  const additionalNetworks = container.additionalNetworks || [];
  const extraNetworkDefinitions = additionalNetworks
    .map(n => `  ${n}:\n    external: true`)
    .join('\n');
  const extraNetworkConnections = additionalNetworks
    .map(n => `      - ${n}`)
    .join('\n');

  return `
networks:
  traefik-public:
    external: true
  deploy-party:
    external: true
${extraNetworkDefinitions ? '\n' + extraNetworkDefinitions : ''}

services:
  plausible_db:
    image: postgres:16-alpine
    volumes:
      - db-data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=postgres
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      start_period: 1m
    deploy:
      restart_policy:
        condition: any
        max_attempts: 3
        window: 120s

  plausible_events_db:
    image: clickhouse/clickhouse-server:24.12-alpine
    volumes:
      - event-data:/var/lib/clickhouse
      - event-logs:/var/log/clickhouse-server
      - ${basePath}/plausible-ce/clickhouse/logs.xml:/etc/clickhouse-server/config.d/logs.xml:ro
      - ${basePath}/plausible-ce/clickhouse/ipv4-only.xml:/etc/clickhouse-server/config.d/ipv4-only.xml:ro
      - ${basePath}/plausible-ce/clickhouse/low-resources.xml:/etc/clickhouse-server/config.d/low-resources.xml:ro
    ulimits:
      nofile:
        soft: 262144
        hard: 262144
    environment:
      - CLICKHOUSE_SKIP_USER_SETUP=1
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 -O - http://127.0.0.1:8123/ping || exit 1"]
      start_period: 1m
    deploy:
      restart_policy:
        condition: any
        max_attempts: 3
        window: 120s

  plausible:
    image: ghcr.io/plausible/community-edition:${container.buildImage || 'v3.1.0'}
    command: sh -c "sleep 15 && /entrypoint.sh db createdb && /entrypoint.sh db migrate && /entrypoint.sh run"
    depends_on:
      - plausible_db
      - plausible_events_db
    volumes:
      - plausible-data:/var/lib/plausible
    ulimits:
      nofile:
        soft: 65535
        hard: 65535
    env_file:
      - .env
    networks:
      - traefik-public
      - deploy-party
      - default
${extraNetworkConnections ? extraNetworkConnections + '\n' : ''}    labels:
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
  db-data:
  event-data:
  event-logs:
  plausible-data:
  `;
}
