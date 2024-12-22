import {ConfigService, CoreCronJobs} from '@lenne.tech/nest-server';
import {Injectable} from '@nestjs/common';
import {SchedulerRegistry} from '@nestjs/schedule';
import {BuildService} from "../../modules/build/build.service";
import {BuildStatus} from "../../modules/build/enums/build-status.enum";
import * as dayjs from 'dayjs'
import {execa} from 'execa';
import {ContainerService} from "../../modules/container/container.service";
import {ContainerStatus} from "../../modules/container/enums/container-status.enum";

@Injectable()
export class CronJobs extends CoreCronJobs {
  logsInProcess = false;
  containerTimeOutInProcess = false;
  buildTimeOutInProcess = false;

  // ===================================================================================================================
  // Initializations
  // ===================================================================================================================
  constructor(
    protected override schedulerRegistry: SchedulerRegistry,
    protected configService: ConfigService,
    private containerService: ContainerService,
    private buildService: BuildService) {
    super(schedulerRegistry, configService.config.cronJobs, { log: true });
  }

  // ===================================================================================================================
  // Cron jobs
  // ===================================================================================================================
  protected async buildTimeout() {
    if (this.buildTimeOutInProcess) {
      return;
    }

    this.buildTimeOutInProcess = true;
    const builds = await this.buildService.findForce({filterQuery: { status: BuildStatus.RUNNING }});

    for (const build of builds) {
      const currentDate = dayjs();
      const createdAt = dayjs(build.createdAt)
      const createdAtMax = createdAt.add(1, 'hour')

      if (currentDate.isAfter(createdAtMax) && !build.restarted) {
        await this.buildService.updateBuildLog(build.id, ' ❌ Build timeout', 'error');
        await this.buildService.setBuildStatus(build.id, BuildStatus.FAILED);
      }
    }

    this.buildTimeOutInProcess = false;
  }

  protected async containerLogs() {
    if (this.logsInProcess) {
      return;
    }

    this.logsInProcess = true;
    const containers = await this.containerService.findForce({filterQuery: { status: ContainerStatus.DEPLOYED }});

    for (const container of containers) {
      await this.containerService.refreshLogs(container);
    }

    this.logsInProcess = false;
  }

  protected async containerStateTimeout() {
    if (this.containerTimeOutInProcess) {
      return;
    }

    this.containerTimeOutInProcess = true;
    const containers = await this.containerService.findForce({filterQuery: { status: ContainerStatus.BUILDING }});

    for (const container of containers) {
      this.buildService.checkNoBuildingsOfContainer(container);
    }

    this.containerTimeOutInProcess = false;
  }

  protected async dockerCleanup() {
    console.debug('Start docker cleanup');
    await execa(
        `docker system prune --force --all`,
        {shell: true}
    );
    await execa('docker network create --driver=overlay deploy-party', {shell: true});
  }
}
