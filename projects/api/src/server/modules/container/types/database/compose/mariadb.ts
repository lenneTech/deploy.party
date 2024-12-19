import {Container} from "../../../container.model";

export async function getMariaDBCompose(container: Container): Promise<string> {
  const dockerCompose: Array<string> = [];

  dockerCompose.push('version: "3.8"');
  dockerCompose.push('networks:');
  dockerCompose.push('    deploy-party:');
  dockerCompose.push('        external: true');
  dockerCompose.push('services:');
  dockerCompose.push(`  ${container.id}_${container.name.replace(/\s/g, '_')}:`);
  dockerCompose.push(`    container_name: ${container.id}_${container.name.replace(/\s/g, '_')}`);
  dockerCompose.push(`    image: ${container.buildImage}`);
  dockerCompose.push(`    networks:`);
  dockerCompose.push(`      - deploy-party`);
  dockerCompose.push(`    labels:`);
  dockerCompose.push(`        deploy.party.id: ${container.id}`);

  if (container.exposedPort) {
    dockerCompose.push(`    ports:`);
    dockerCompose.push(`      - "${container.port}:${container.exposedPort}"`);
  }

  if (container?.env) {
    dockerCompose.push(`    env_file:`);
      dockerCompose.push(`      - .env`);
  }

  dockerCompose.push(`    volumes:`);
  dockerCompose.push(`      - ${container.id}:/var/lib/mysql`);

  dockerCompose.push(``);
  dockerCompose.push(`volumes:`);
  dockerCompose.push(`  ${container.id}:`);

  return dockerCompose.join('\n');
}