import {Container} from "../../../container.model";

export async function getMongoCompose(container: Container): Promise<string> {
  const dockerCompose: Array<string> = [];

  dockerCompose.push('networks:');
  dockerCompose.push('    deploy-party:');
  dockerCompose.push('        external: true');
  dockerCompose.push('services:');
  dockerCompose.push(`  ${container.id}_${container.name.trim().replace(/\s/g, '_')}:`);
  dockerCompose.push(`    container_name: ${container.id}_${container.name.trim().replace(/\s/g, '_')}`);
  dockerCompose.push(`    image: ${container.buildImage}`);
  dockerCompose.push(`    networks:`);
  dockerCompose.push(`      - deploy-party`);
  dockerCompose.push(`    labels:`);
  dockerCompose.push(`        deploy.party.id: ${container.id}`);

  if (container.exposedPort) {
    dockerCompose.push(`    ports:`);
    dockerCompose.push(`      - "${container.exposedPort}:${container.port}"`);
  }

  if (container?.basicAuth?.username && container?.basicAuth?.pw) {
    dockerCompose.push(`    environment:`);
      dockerCompose.push(`      TZ: "Europe/Berlin"`);
    if (container?.basicAuth?.username) {
      dockerCompose.push(`      MONGO_INITDB_ROOT_USERNAME: ${container.basicAuth.username}`);
    }
    if (container?.basicAuth?.pw) {
      dockerCompose.push(`      MONGO_INITDB_ROOT_PASSWORD: ${container.basicAuth.pw}`);
    }
  }

  dockerCompose.push(`    volumes:`);
  dockerCompose.push(`      - ${container.id}:/data/db`);

  if (container.maxMemory) {
    dockerCompose.push(`    command: --wiredTigerCacheSizeGB ${container.maxMemory}`);
  }

  dockerCompose.push(``);
  dockerCompose.push(`volumes:`);
  dockerCompose.push(`  ${container.id}:`);

  return dockerCompose.join('\n');
}
