import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as dayjs from 'dayjs';
import * as timezone from 'dayjs/plugin/timezone';
import * as utc from 'dayjs/plugin/utc';
import { execa } from 'execa';
import { promises as fs } from 'fs';
import envConfig from "../../../config.env";
import { BuildService } from "../../modules/build/build.service";
import { Container } from "../../modules/container/container.model";
import { ContainerService } from "../../modules/container/container.service";
import { ContainerHealthStatus } from "../../modules/container/enums/container-health-status.enum";
import { ContainerType } from '../../modules/container/enums/container-type.enum';
import { DatabaseType } from '../../modules/container/enums/database-type.enum';
import { ServiceType } from "../../modules/container/enums/service-type.enum";
import { ContainerStats } from "../../modules/container/outputs/container-stats.output";
import { getNodeCompose } from "../../modules/container/types/container/compose/node";
import { getStaticCompose } from "../../modules/container/types/container/compose/static";
import { getNodeImage } from "../../modules/container/types/container/images/node";
import { getStaticImage } from "../../modules/container/types/container/images/static";
import { getMariaDBCompose } from "../../modules/container/types/database/compose/mariadb";
import { getMongoCompose } from "../../modules/container/types/database/compose/mongo";
import { getAdminer } from "../../modules/container/types/service/adminer/compose";
import { getDirectus } from "../../modules/container/types/service/directus/compose";
import { getMongoExpress } from "../../modules/container/types/service/mongo-express/compose";
import { getPlausible } from "../../modules/container/types/service/plausible/compose";
import { getRedisUi } from "../../modules/container/types/service/redis-ui/compose";
import { getRocketAdmin } from "../../modules/container/types/service/rocketadmin/compose";
import { Registry } from "../../modules/registry/registry.model";
import { FileService } from "./file.service";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Europe/Berlin');

@Injectable()
export class DockerService {
  constructor(
    @Inject(forwardRef(() => BuildService)) private buildService: BuildService,
    @Inject(forwardRef(() => ContainerService)) private containerService: ContainerService,
    private fileService: FileService,
  ) {
  }

  // ===================================================================================================================
  // Methods
  // ===================================================================================================================

  async createDockerfile(container: Container): Promise<void> {
    let image: string;
    const type = container.type ? container.type : container.kind;

    switch (type) {
      case ContainerType.NODE:
        image = await getNodeImage(container);
        break;
      case ContainerType.STATIC:
        image = await getStaticImage(container);
        break;
      case ContainerType.CUSTOM:
        image = container.customDockerfile;
        break;
    }

    if (!image) {
      return;
    }

    await fs.writeFile(`${this.getPath(container)}/Dockerfile`, image);
  }

  async createDockerComposeFile(container: Container): Promise<void> {
    let compose: string;
    const type = container.type ? container.type : container.kind;

    switch (type) {
      case ContainerType.NODE:
        compose = await getNodeCompose(container);
        break;
      case ContainerType.STATIC:
        compose = await getStaticCompose(container);
        break;
      case DatabaseType.MONGO:
        compose = await getMongoCompose(container);
        break;
      case DatabaseType.MARIA_DB:
        compose = await getMariaDBCompose(container);
        break;
      case ServiceType.DIRECTUS:
        // generate key and secret
        if (!container.env) {
          const key = Array.from({ length: 36 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
          const secret = Array.from({ length: 36 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
          container.env = `
          KEY=${key}
          SECRET=${secret}

          DB_CLIENT=pg
          DB_HOST=database
          DB_PORT=5432
          DB_DATABASE=directus
          DB_USER=directus
          DB_PASSWORD=directus

          CACHE_ENABLED=true
          CACHE_STORE=redis
          REDIS=redis://cache:6379

          ADMIN_EMAIL=admin@directus.com
          ADMIN_PASSWORD=d1r3ctu5

          # Make sure to set this in production
          # (see https://docs.directus.io/self-hosted/config-options#general)
          PUBLIC_URL=https://${container.url}
          `;
          await this.containerService.updateForce(container.id, { env: container.env });
          await this.createEnvFile(container);
        }
        compose = getDirectus(container);
        break;
      case ServiceType.ADMINER:
        compose = await getAdminer(container);
        break;
      case ServiceType.ROCKET_ADMIN:
        if (!container.env) {
          const jwtKey = randomBytes(32).toString('hex');
          const privateKey = randomBytes(32).toString('hex');
          const temporaryKey = randomBytes(32).toString('hex');
          const postgresPassword = randomBytes(16).toString('hex');

          container.env = `
JWT_SECRET=${jwtKey}
PRIVATE_KEY=${privateKey}
TEMPORARY_JWT_SECRET=${temporaryKey}
DATABASE_URL=postgres://rocket:${postgresPassword}@${container.id}_postgres:5432/rocketadmin

POSTGRES_USER=rocket
POSTGRES_DB=rocketadmin
POSTGRES_PASSWORD=${postgresPassword}
          `;

          await this.containerService.updateForce(container.id, { env: container.env });
          await this.createEnvFile(container);
        }
        compose = await getRocketAdmin(container);
        break;
      case ServiceType.MONGO_EXPRESS:
        if (!container.env) {
          container.env = `
ME_CONFIG_MONGODB_URL=mongodb://[CONTAINER_ID]_[CONTAINER_NAME]:27017/[DB_NAME]?ssl=false
ME_CONFIG_BASICAUTH_ENABLED=true
ME_CONFIG_BASICAUTH_USERNAME=USERNAME
ME_CONFIG_BASICAUTH_PASSWORD=PASSWORD
ME_CONFIG_MONGODB_ENABLE_ADMIN=true
ME_CONFIG_MONGODB_AUTH_USERNAME=
ME_CONFIG_MONGODB_AUTH_PASSWORD=
          `;

          await this.containerService.updateForce(container.id, { env: container.env });
          await this.createEnvFile(container);
        }
        compose = await getMongoExpress(container);
        break;
      case ServiceType.REDIS_UI:
        if (!container.env) {
          container.env = `
REDIS_URL=redis://[CONTAINER_ID]_[CONTAINER_NAME]:6379
REDIS_PASSWORD=
`;
          await this.containerService.updateForce(container.id, { env: container.env });
          await this.createEnvFile(container);
        }
        compose = await getRedisUi(container);
        break;
      case ServiceType.PLAUSIBLE:
        if (!container.env) {
          const secretKeyBase = randomBytes(64).toString('base64');

          container.env = `
# Plausible Configuration
BASE_URL=https://${container.url}
SECRET_KEY_BASE=${secretKeyBase}

# Database (uses internal service names)
DATABASE_URL=postgres://postgres:postgres@postgres:5432/plausible

# ClickHouse (uses internal service name)
CLICKHOUSE_DATABASE_URL=http://clickhouse:8123/plausible

# SMTP Configuration (replace with your SMTP settings)
MAILER_EMAIL=hello@example.com
SMTP_HOST_ADDR=smtp.example.com
SMTP_HOST_PORT=587
SMTP_USER_NAME=your-smtp-user
SMTP_USER_PWD=your-smtp-password
SMTP_HOST_SSL_ENABLED=true

# Registration (set to invite_only to disable public registration)
DISABLE_REGISTRATION=false
`;

          await this.containerService.updateForce(container.id, { env: container.env });
          await this.createEnvFile(container);
        }
        compose = getPlausible(container);
        break;
      case ContainerType.CUSTOM:
        compose = container.customDockerCompose;
        break;
    }

    if (!compose) {
      return;
    }

    await fs.writeFile(`${this.getPath(container)}/docker-compose.yml`, compose);
  }

  async createEnvFile(container: Container) {
    if (!container.env) {
      return;
    }

    try {
      await fs.writeFile(
        `${this.getPath(container)}/.env`,
        container.env
      );
    } catch (e) {
      console.error(e);
    }

    try {
      await fs.writeFile(
        `${this.getPath(container)}/code/.env`,
        container.env
      );
    } catch (e) {
      console.error(e);
    }

    if (container.baseDir) {
      try {
        await fs.writeFile(
          `${this.getPath(container)}/code/${container.baseDir.replace('./', '')}/.env`,
          container.env
        );
      } catch (e) {
        console.error(e);
      }
    }
  }

  async createDockerRegistryCredentials(container: Container) {
    const username = (container.registry as Registry).username;
    const password = (container.registry as Registry).pw;
    const url = (container.registry as Registry).url;

    if (!username || !password) {
      return null;
    }

    const payload = JSON.stringify({
      auths: {
        [url]: {
          auth: Buffer.from(`${username}:${password}`).toString('base64'),
        },
      },
    });

    await this.fileService.createFolder(`${this.getPath(container)}/.docker`);
    return fs.writeFile(`${this.getPath(container)}/.docker/config.json`, payload);
  }

  async deleteVolume(container: Container) {
    const process = execa(
      `docker volume rm ${container.id}_${container.id}`,
      { shell: true }
    );

    return true;
  }

  async buildImage(container: Container, buildId: string) {
    const process = execa(
      `docker compose --project-directory ${this.getPath(container)} build`,
      { shell: true }
    );

    return this.prepareProcess(process, buildId);
  }

  async pushImage(container: Container, buildId: string) {
    const configExist = await this.fileService.checkConfigExist(container);
    const process = execa(
      `docker ${configExist ? `--config ${this.getPath(container)}/.docker` : ''} compose --project-directory ${this.getPath(container)} push`,
      { shell: true }
    );

    return this.prepareProcess(process, buildId);
  }

  private prepareProcess(process: any, buildId: string) {
    return new Promise((resolve, reject) => {
      process.stdout.on('data', async (data) => {
        const stdout = data.toString();
        const array = stdout.split('\n');
        for (const line of array) {
          if (line !== '\n' && line !== '') {
            const log = `${line.replace('\n', '')}`;
            await this.buildService.updateBuildLog(buildId, log, 'log');
          }
        }
      });

      process.stderr.on('data', async (data) => {
        const stderr = data.toString();
        const array = stderr.split('\n');
        for (const line of array) {
          if (line !== '\n' && line !== '') {
            const log = `${line.replace('\n', '')}`;
            await this.buildService.updateBuildLog(buildId, log, 'error');
          }
        }
      });

      process.on('exit', async (code) => {
        //await asyncSleep(1000);
        if (code === 0) {
          resolve(code);
        } else {
          reject(code);
        }
      });
    });
  }

  async getId(containerId: string): Promise<string | null> {
    const { stdout: ids } = await execa(
      `docker ps -a --filter 'label=deploy.party.id=${containerId}' --format {{.ID}}`,
      { shell: true }
    );

    const idsArray = ids.split('\n');
    return idsArray.length ? idsArray[0] : null;
  }

  async getServiceContainers(containerId: string): Promise<any[]> {
    // First try to find containers with the deploy.party.id label
    const { stdout: labelContainerList } = await execa(
      `docker ps --filter 'label=deploy.party.id=${containerId}' --format '{{json .}}'`,
      { shell: true }
    );

    // If we find containers with the label, also search for related containers by name prefix
    if (labelContainerList.trim()) {
      // Search for all containers that start with the containerId prefix (like 6870e11f3af612ab0693d5b8_*)
      const { stdout: nameContainerList } = await execa(
        `docker ps --filter 'name=^${containerId}_' --format '{{json .}}'`,
        { shell: true }
      );

      const labelContainers = labelContainerList
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));

      const nameContainers = nameContainerList.trim()
        ? nameContainerList
          .split('\n')
          .filter(line => line.trim())
          .map(line => JSON.parse(line))
        : [];

      // Combine both results and remove duplicates based on container ID
      const allContainers = [...labelContainers, ...nameContainers];
      return allContainers.filter((container, index, self) =>
        index === self.findIndex(c => c.ID === container.ID)
      );
    }

    return [];
  }

  async deploy(container: Container): Promise<string | null> {
    const configExist = await this.fileService.checkConfigExist(container);

    const { stdout: containers } = await execa(
      envConfig.dockerSwarm
        ? `docker ${configExist ? `--config ${this.getPath(container)}/.docker` : ''} stack deploy -c ${this.getPath(container)}/docker-compose.yml ${container.id}`
        : `docker ${configExist ? `--config ${this.getPath(container)}/.docker` : ''} compose --project-directory ${this.getPath(container)} up -d`,
      { shell: true }
    );

    return containers.length ? containers[0] : null;
  }

  async stop(container: Container): Promise<string | null> {
    const { stdout: containers } = await execa(
      envConfig.dockerSwarm
        ? `docker stack rm ${container.id}`
        : `docker compose --project-directory ${this.getPath(container)} down`,
      { shell: true }
    );

    return containers.length ? containers[0] : null;
  }

  async getLogs(container: Container, since?: string): Promise<string[]> {
    const dockerId = await this.getId(container.id);

    if (!dockerId) {
      return [];
    }

    const { stdout, stderr } = await execa(
      `docker logs ${since ? `--since ${since}` : ''} --tail 2000 --timestamps ${dockerId}`,
      {
        shell: true,
      }
    );
    const stripLogsStdout = stdout
      .toString()
      .split('\n')
      .filter((a) => a)
      .map((a) => `[LOG] - ${a}`);
    const stripLogsStderr = stderr
      .toString()
      .split('\n')
      .filter((a) => a)
      .map((a) => `[ERROR] - ${a}`);

    return stripLogsStdout.concat(stripLogsStderr);
  }

  async getStats(source: Container): Promise<ContainerStats> {
    try {
      const dockerId = await this.getId(source.id);

      if (!dockerId) {
        throw new Error('Docker container not found');
      }

      const { stdout } = await execa(
        `docker container stats ${dockerId} --no-stream --no-trunc --format "{{json .}}"`,
        { shell: true }
      );
      return JSON.parse(stdout);
    } catch (e) {
      console.error(e);
      return {
        MemUsage: '',
        CPUPerc: '',
        NetIO: '',
      };
    }
  }

  async getHealthStatus(source: Container): Promise<ContainerHealthStatus> {
    try {
      const dockerId = await this.getId(source.id);

      if (!dockerId) {
        throw new Error('Docker container not found');
      }

      const { stdout } = await execa(`docker inspect --format='{{json .State.Health.Status}}' ${dockerId}`, {
        shell: true,
      });
      return stdout.replace(/"/g, '').toUpperCase() as ContainerHealthStatus;
    } catch (e) {
      return ContainerHealthStatus.UNHEALTHY;
    }
  }

  getPath(container: Container) {
    const source = this.containerService.getContainerSource(container, true);
    return `${envConfig.projectsDir}/${container.id}${source ? `/${source}` : ''}`;
  }
}
