import {execa} from "execa";
import {Container} from "../../../container.model";
import {Build} from "../../../../build/build.model";
import {Registry} from "../../../../registry/registry.model";
import {DeploymentType} from "../../../enums/deployment-type.enum";
import {ContainerVolumeType} from "../../../enums/container-volume-types.enum";

export async function getNodeCompose(container: Container, build?: Build): Promise<string> {
  const hostOnly = container.url.replace('https://', '').replace('http://', '');
  const dockerCompose: Array<string> = [];
  const middlewares: Array<string> = [];

  const getImageUrl = (container: Container) => {
    let imageUrl;
    if (container.repositoryUrl?.includes('gitlab') && (container.registry as Registry).url?.includes('gitlab')) {
      imageUrl = container.repositoryUrl.replace(/^https?:\/\//, '').replace(/([^\/]+)/, '$1:5050');
    } else {
      imageUrl = `${(container.registry as Registry).url}/${container.id}`;
    }
    return imageUrl;
  }

  const getSource = (container: Container) => {
    return container.deploymentType === DeploymentType.TAG ? container.tag : container.branch;
  }

  dockerCompose.push('networks:');
  dockerCompose.push('    traefik-public:');
  dockerCompose.push('        external: true');
  dockerCompose.push('    deploy-party:');
  dockerCompose.push('        external: true');
  dockerCompose.push('services:');
  dockerCompose.push(`  ${container.name.replace(/\s/g, '_')}:`);
  dockerCompose.push(`    container_name: ${container.name}`);
  dockerCompose.push(`    build:`);
  dockerCompose.push(`      context: .`);
  dockerCompose.push(`      dockerfile: Dockerfile`);
  dockerCompose.push(`    image: ${getImageUrl(container)}:${getSource(container)}`);
  dockerCompose.push(`    labels:`);
  dockerCompose.push(`        deploy.party.id: ${container.id}`);

  if (build) {
    dockerCompose.push(`        deploy.party.build.id: ${build.id}`);
  }

  dockerCompose.push(`    restart: unless-stopped`);

  if (container.env) {
    dockerCompose.push(`    env_file:`);
    dockerCompose.push(`      - .env`);
  }

  if (container.exposedPort) {
    dockerCompose.push(`    ports:`);
    dockerCompose.push(`      - "${container.exposedPort}:${container.port}"`);
  }

  dockerCompose.push(`    networks:`);
  dockerCompose.push(`      - traefik-public`);
  dockerCompose.push(`      - deploy-party`);
  if (container.volumes?.length) {
  dockerCompose.push(`    volumes:`);
    for (const volume of container.volumes) {
      if (volume.type === ContainerVolumeType.DIRECTORY_MOUNT) {
        dockerCompose.push(`      - ${volume.source}:${volume.destination}`);
      }
    }
  }
  dockerCompose.push(`    deploy:`);
  dockerCompose.push(`      placement:`);
  dockerCompose.push(`          constraints:`);
  dockerCompose.push(`              - node.labels.traefik-public.traefik-public-certificates == true`);
  dockerCompose.push(`      update_config:`);
  dockerCompose.push(`          order: start-first`);
  dockerCompose.push(`          failure_action: rollback`);
  dockerCompose.push(`          delay: 10s`);
  dockerCompose.push(`      rollback_config:`);
  dockerCompose.push(`          parallelism: 0`);
  dockerCompose.push(`          order: stop-first`);
  dockerCompose.push(`      restart_policy:`);
  dockerCompose.push(`          condition: any`);
  dockerCompose.push(`          delay: 5s`);
  dockerCompose.push(`          window: 120s`);
  dockerCompose.push(`      labels:`);
  dockerCompose.push(`          - traefik.enable=true`);
  dockerCompose.push(`          - traefik.docker.network=traefik-public`);
  dockerCompose.push(`          - traefik.constraint-label=traefik-public`);

  if (container.isCustomRule) {
    dockerCompose.push(`          - traefik.http.routers.${container.id}-http.rule=${container.url}`);
  } else {
    dockerCompose.push(
      `          - traefik.http.routers.${container.id}-http.rule=Host(\`${hostOnly}\`)${
        container.www ? ` || Host(\`www.${hostOnly}\`)` : ''
      }`
    );
  }
  dockerCompose.push(`          - traefik.http.routers.${container.id}-http.entrypoints=http`);

  if (container.ssl) {
    dockerCompose.push(`          - traefik.http.routers.${container.id}-http.middlewares=https-redirect@swarm`);

    if (container.isCustomRule) {
      dockerCompose.push(`          - traefik.http.routers.${container.id}-https.rule=${container.url}`);
    } else {
      dockerCompose.push(
        `          - traefik.http.routers.${container.id}-https.rule=Host(\`${hostOnly}\`)${
          container.www ? ` || Host(\`www.${hostOnly}\`)` : ''
        }`
      );
    }

    dockerCompose.push(`          - traefik.http.routers.${container.id}-https.entrypoints=https`);
    dockerCompose.push(`          - traefik.http.routers.${container.id}-https.tls=true`);
    dockerCompose.push(`          - traefik.http.routers.${container.id}-https.tls.certresolver=le`);
  }

  if (container.www) {
    dockerCompose.push(`          - traefik.http.middlewares.${container.id}-redirect.redirectregex.regex=^https://www\.(.*)`);
    dockerCompose.push(`          - traefik.http.middlewares.${container.id}-redirect.redirectregex.replacement=https://$$1`);
    dockerCompose.push(`          - traefik.http.middlewares.${container.id}-redirect.redirectregex.permanent=true`);
    middlewares.push(`${container.id}-redirect`);
  }

  if (container.compress) {
    dockerCompose.push(`          - traefik.http.middlewares.${container.id}-compress.compress=true`);
    middlewares.push(`${container.id}-compress`);
  }

  if (container?.basicAuth?.username && container?.basicAuth?.pw) {
    // Hash password
    const {stdout: creds} = await execa(
      `echo $(htpasswd -nb ${container.basicAuth.username} ${container.basicAuth.pw})`,
      {shell: true}
    );
    // Set password and replace all $ in hash with $$ for escaping
    dockerCompose.push(
      `          - traefik.http.middlewares.${container.id}-auth.basicauth.users=${creds.replace(/\$/ig, '$$$')}`
    );
    middlewares.push(`${container.id}-auth`);
  }

  if (container.ssl) {
    middlewares.push('secure-headers');
    dockerCompose.push(`          - traefik.http.routers.${container.id}-https.middlewares=${middlewares.join(',')}`);
  } else {
    if (middlewares?.length) {
      dockerCompose.push(`          - traefik.http.routers.${container.id}-http.middlewares=${middlewares.join(',')}`);
    }
  }

  dockerCompose.push(`          - traefik.http.services.${container.id}.loadbalancer.server.port=${container.port}`);

  return dockerCompose.join('\n');
}
