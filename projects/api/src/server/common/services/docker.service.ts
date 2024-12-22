import {forwardRef, Inject, Injectable} from '@nestjs/common';
import * as dayjs from 'dayjs';
import * as timezone from 'dayjs/plugin/timezone';
import * as utc from 'dayjs/plugin/utc';
import {execa} from 'execa';
import {promises as fs} from 'fs';
import envConfig from "../../../config.env";
import {BuildService} from "../../modules/build/build.service";
import {Container} from "../../modules/container/container.model";
import {getNodeImage} from "../../modules/container/types/container/images/node";
import {Registry} from "../../modules/registry/registry.model";
import {getNodeCompose} from "../../modules/container/types/container/compose/node";
import {getMongoCompose} from "../../modules/container/types/database/compose/mongo";
import {ServiceType} from "../../modules/container/enums/service-type.enum";
import {getDirectus} from "../../modules/container/types/service/directus/compose";
import {ContainerStats} from "../../modules/container/outputs/container-stats.output";
import {ContainerType} from '../../modules/container/enums/container-type.enum';
import {DatabaseType} from '../../modules/container/enums/database-type.enum';
import {FileService} from "./file.service";
import {ContainerHealthStatus} from "../../modules/container/enums/container-health-status.enum";
import {getAdminer} from "../../modules/container/types/service/adminer/compose";
import {getStaticCompose} from "../../modules/container/types/container/compose/static";
import {getStaticImage} from "../../modules/container/types/container/images/static";
import {getMariaDBCompose} from "../../modules/container/types/database/compose/mariadb";
import {ContainerService} from "../../modules/container/container.service";

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
        compose = getDirectus(container);
        break;
      case ServiceType.ADMINER:
        compose = getAdminer(container);
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
      {shell: true}
    );

    return true;
  }

  async buildImage(container: Container, buildId: string) {
    const process = execa(
      `docker compose --project-directory ${this.getPath(container)} build`,
      {shell: true}
    );

    return this.prepareProcess(process, buildId);
  }

  async pushImage(container: Container, buildId: string) {
    const configExist = await this.fileService.checkConfigExist(container);
    const process = execa(
      `docker ${configExist ? `--config ${this.getPath(container)}/.docker` : ''} compose --project-directory ${this.getPath(container)} push`,
      {shell: true}
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
    const {stdout: ids} = await execa(
      `docker ps -a --filter 'label=deploy.party.id=${containerId}' --format {{.ID}}`,
      {shell: true}
    );

    const idsArray = ids.split('\n');
    return idsArray.length ? idsArray[0] : null;
  }

  async deploy(container: Container): Promise<string | null> {
    const configExist = await this.fileService.checkConfigExist(container);

    const {stdout: containers} = await execa(
      envConfig.dockerSwarm
        ? `docker ${configExist ? `--config ${this.getPath(container)}/.docker` : ''} stack deploy -c ${this.getPath(container)}/docker-compose.yml ${container.id}`
        : `docker ${configExist ? `--config ${this.getPath(container)}/.docker` : ''} compose --project-directory ${this.getPath(container)} up -d`,
      {shell: true}
    );

    return containers.length ? containers[0] : null;
  }

  async stop(container: Container): Promise<string | null> {
    const {stdout: containers} = await execa(
      envConfig.dockerSwarm
        ? `docker stack rm ${container.id}`
        : `docker compose --project-directory ${this.getPath(container)} down`,
      {shell: true}
    );

    return containers.length ? containers[0] : null;
  }

  async getLogs(container: Container, since?: string): Promise<string[]> {
    const dockerId = await this.getId(container.id);

    if (!dockerId) {
      return [];
    }

    const {stdout, stderr} = await execa(
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

      const {stdout} = await execa(
        `docker container stats ${dockerId} --no-stream --no-trunc --format "{{json .}}"`,
        {shell: true}
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

      const {stdout} = await execa(`docker inspect --format='{{json .State.Health.Status}}' ${dockerId}`, {
        shell: true,
      });
      return stdout.replace(/"/g, '').toUpperCase() as ContainerHealthStatus;
    } catch (e) {
      return ContainerHealthStatus.UNHEALTHY;
    }
  }

  async getTerminalSession(source: Container): Promise<string> {
    try {
      const dockerId = await this.getId(source.id);

      if (!dockerId) {
        throw new Error('Docker container not found');
      }

      const {stdout} = await execa(`docker exec -it ${dockerId} sh`, {
        shell: true,
      });
      return stdout.replace(/"/g, '');
    } catch (e) {
      console.error('getDockerHealthStatus', e);
      return 'unhealthy';
    }
  }

  getPath(container: Container) {
    const source = this.containerService.getContainerSource(container);
    return `${envConfig.projectsDir}/${container.id}${source ? `/${source}` : ''}`;
  }
}
