import {Container} from "../../../container.model";

export function getDirectus(container: Container): string {
  return `
    version: "3.8"

    networks:
      traefik-public:
        external: true
      deploy-party:
        external: true
      directus-internal:
        driver: overlay

    services:
      database:
        image: postgis/postgis:13-master
        # Required when running on platform other than amd64, like Apple M1/M2:
        # platform: linux/amd64
        volumes:
          - directusDb:/var/lib/postgresql/data
        environment:
          POSTGRES_USER: "directus"
          POSTGRES_PASSWORD: "directus"
          POSTGRES_DB: "directus"
        networks:
          - directus-internal

      cache:
        image: redis:6
        networks:
          - directus-internal

      directus:
        image: directus/directus:${container.buildImage || 'latest'}
        volumes:
          - uploads:/directus/uploads
          # If you want to load extensions from the host
          # - ./extensions:/directus/extensions
        depends_on:
          - cache
          - database
        env_file:
          - .env
        networks:
          - traefik-public
          - directus-internal
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
            - traefik.http.services.${container.id}.loadbalancer.server.port=8055

    volumes:
      uploads:
      directusDb:
      `
}
