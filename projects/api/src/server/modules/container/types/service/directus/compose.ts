import {Container} from "../../../container.model";

export function getDirectus(container: Container): string {
  // generate key and secret
  const key = Array.from({ length: 36 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const secret = Array.from({ length: 36 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return `
    version: "3.8"

    networks:
      traefik-public:
        external: true

    services:
      database:
        image: postgis/postgis:13-master
        # Required when running on platform other than amd64, like Apple M1/M2:
        # platform: linux/amd64
        volumes:
          - ./data/database:/var/lib/postgresql/data
        environment:
          POSTGRES_USER: "directus"
          POSTGRES_PASSWORD: "directus"
          POSTGRES_DB: "directus"

      cache:
        image: redis:6

      directus:
        image: directus/directus:10.8.2
        volumes:
          - uploads:/directus/uploads
          # If you want to load extensions from the host
          # - ./extensions:/directus/extensions
        depends_on:
          - cache
          - database
        environment:
          KEY: "${key}"
          SECRET: "${secret}"

          DB_CLIENT: "pg"
          DB_HOST: "database"
          DB_PORT: "5432"
          DB_DATABASE: "directus"
          DB_USER: "directus"
          DB_PASSWORD: "directus"

          CACHE_ENABLED: "true"
          CACHE_STORE: "redis"
          REDIS: "redis://cache:6379"

          ADMIN_EMAIL: "admin@directus.com"
          ADMIN_PASSWORD: "d1r3ctu5"

          # Make sure to set this in production
          # (see https://docs.directus.io/self-hosted/config-options#general)
          PUBLIC_URL: "https://${container.url}"
        networks:
          - traefik-public
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
          - traefik.http.services.${container.id}-app.loadbalancer.server.port=80

    volumes:
      uploads:
      `
}
