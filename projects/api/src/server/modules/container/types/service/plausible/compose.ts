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

configs:
  clickhouse_logs_config:
    content: |
      <clickhouse>
          <logger>
              <level>warning</level>
              <console>true</console>
          </logger>
          <query_log replace="1">
              <database>system</database>
              <table>query_log</table>
              <flush_interval_milliseconds>7500</flush_interval_milliseconds>
              <engine>
                  ENGINE = MergeTree
                  PARTITION BY event_date
                  ORDER BY (event_time)
                  TTL event_date + interval 30 day
                  SETTINGS ttl_only_drop_parts=1
              </engine>
          </query_log>
          <metric_log remove="remove" />
          <asynchronous_metric_log remove="remove" />
          <query_thread_log remove="remove" />
          <text_log remove="remove" />
          <trace_log remove="remove" />
          <session_log remove="remove" />
          <part_log remove="remove" />
      </clickhouse>
  clickhouse_ipv4_config:
    content: |
      <clickhouse>
          <listen_host>0.0.0.0</listen_host>
      </clickhouse>
  clickhouse_resources_config:
    content: |
      <clickhouse>
          <mark_cache_size>524288000</mark_cache_size>
          <profile>
              <default>
                  <max_threads>1</max_threads>
                  <max_block_size>8192</max_block_size>
                  <max_download_threads>1</max_download_threads>
                  <input_format_parallel_parsing>0</input_format_parallel_parsing>
                  <output_format_parallel_formatting>0</output_format_parallel_formatting>
              </default>
          </profile>
      </clickhouse>

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
    configs:
      - source: clickhouse_logs_config
        target: /etc/clickhouse-server/config.d/logs.xml
      - source: clickhouse_ipv4_config
        target: /etc/clickhouse-server/config.d/ipv4-only.xml
      - source: clickhouse_resources_config
        target: /etc/clickhouse-server/config.d/low-resources.xml
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
    command: sh -c "/app/bin/plausible eval Plausible.Release.setup_clickhouse && /app/bin/plausible eval Plausible.Release.migrate && /app/bin/plausible start"
    depends_on:
      postgres:
        condition: service_healthy
      clickhouse:
        condition: service_healthy
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
