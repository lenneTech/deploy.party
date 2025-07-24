import {forwardRef, Inject, Injectable} from "@nestjs/common";
import {Container} from "../../modules/container/container.model";
import {promises as fs} from "fs";
import envConfig from "../../../config.env";
import {ContainerService} from "../../modules/container/container.service";

@Injectable()
export class FileService {
  constructor(
    @Inject(forwardRef(() => ContainerService)) private containerService: ContainerService,
  ) {}

  private getPath(container: Container) {
    const source = this.containerService.getContainerSource(container, true);
    return `${envConfig.projectsDir}/${container.id}${source ? `/${source}` : ''}`;
  }

  checkDockerFileExist(container: Container): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      fs
        .access(`${this.getPath(container)}'/Dockerfile`)
        .then((value) => {
          resolve(true);
        })
        .catch(() => {
          resolve(false);
        });
    });
  }

  checkProjectExist(container: Container): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      fs
        .access(this.getPath(container))
        .then((value) => {
          resolve(true);
        })
        .catch(() => {
          resolve(false);
        });
    });
  }

  async recreateFolder(path: string) {
    try {
      await fs.access(path);
      await fs.rm(path, {recursive: true, force: true});
      await fs.mkdir(path, {recursive: true});
    } catch (error) {
      await fs.mkdir(path, {recursive: true});
    }
  }

  async removeDockerFiles(container: Container) {
    const configExist = await this.checkConfigExist(container);
    const dockerfileExist = await this.checkDockerFileExist(container);

    if (configExist) {
      await fs.rm(`${this.getPath(container)}/.docker`, {recursive: true});
    }

    if (dockerfileExist) {
      await fs.rm(`${this.getPath(container)}/Dockerfile`);
    }

    await fs.rm(`${this.getPath(container)}/docker-compose.yml`);
  }

  checkConfigExist(container: Container): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      fs
        .access(`${this.getPath(container)}/.docker`)
        .then((value) => {
          resolve(true);
        })
        .catch((e) => {
          resolve(false);
        });
    });
  }

  createFolder(path: string) {
    return fs.mkdir(path, {recursive: true});
  }

  async createProjectFolder(container: Container) {
    return this.createFolder(this.getPath(container));
  }

  async removeProjectFolder(container: Container) {
    if (await this.checkProjectExist(container)) {
      await fs.rmdir(`${envConfig.projectsDir}/${container.id}`, {recursive: true});
    }

    return true;
  }
}
