import {
  OnQueueActive,
  OnQueueError,
  OnQueueFailed,
  OnQueueProgress,
  OnQueueStalled,
  OnQueueWaiting,
  Process,
  Processor
} from "@nestjs/bull";
import {Job} from "bull";
import {BuildService} from "../build.service";
import {Source} from "../../source/source.model";
import {forwardRef, Inject, Logger} from "@nestjs/common";
import {ContainerService} from "../../container/container.service";
import {BuildStatus} from "../enums/build-status.enum";
import {AdditionalBuildInfos} from "../../../common/interfaces/additional-build-infos.interface";
import envConfig from "../../../../config.env";
import {DeploymentType} from "../../container/enums/deployment-type.enum";

@Processor('build')
export class BuildProcessor {
  private readonly logger = new Logger(BuildProcessor.name);

  constructor(
    private buildService: BuildService,
    @Inject(forwardRef(() => ContainerService))
    private containerService: ContainerService,
  ) {}

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug(`Processing job ${job.id} of type ${job.name} with data ${JSON.stringify(job.data)}...`);
  }

  @OnQueueError()
  onError(error: Error) {
    this.logger.debug(`Processing failed: ${error.message}`);
  }

  @OnQueueStalled()
  onStalled(job: Job) {
    this.logger.debug(`Processing stalled: ${job.id}`);
  }

  @OnQueueFailed()
  async onFailed(job: Job, error: any) {
    this.logger.error(`Failed job ${job.id} of type ${job.name}: ${error.message}`, error.stack);
    await this.buildService.updateBuildLog(job.data.buildId, error.message, 'error');
    await this.buildService.update(job.data.buildId, {
      status: BuildStatus.FAILED,
    })
  }

  @OnQueueWaiting()
  onWaiting(job: Job) {
    this.logger.debug(`Processing waiting: ${job.id} => ${job.name}`);
  }

  @OnQueueProgress()
  onProgress(job: Job, progress: number) {
    this.logger.debug(`Processing job ${job.id} of type ${job.name} with progress ${progress}%`);
  }

  @Process({concurrency: envConfig.buildConcurrency})
  async build(job: Job<{ containerId: string; buildId: string; additionalInfos?: AdditionalBuildInfos }>) {
    this.logger.debug(`Start processing job ${job.id} of type ${job.name} with data ${job.data}...`);
    const startTime = new Date().getTime();
    const build = await this.buildService.getForce(job.data.buildId);

    // update containers version if deployment type tag
    if (job?.data?.additionalInfos?.deploymentType === DeploymentType.TAG) {
      await this.containerService.updateForce(job?.data?.containerId, {tag: job?.data?.additionalInfos.targetVersion});
    }

    const container = await this.containerService.getForce(job.data.containerId, {populate: ['source']});

    if (!container.source) {
      await this.buildService.setBuildStatus(build.id, BuildStatus.FAILED, job.data.additionalInfos);
      throw new Error('Container source is not defined');
    }

    try {
      await this.buildService.cloneGitLab(container, build, (container.source as Source).token);
    } catch (e) {
      this.logger.error(e.message, e.stack);
      if (!e.message.includes('Build was canceled')) {
        await this.buildService.setBuildStatus(build.id, BuildStatus.FAILED, job.data.additionalInfos);
      }
    }

    try {
      await this.buildService.triggerBuild(container.id, build.id, job.data.additionalInfos);
    } catch (e) {
      this.logger.error(e.message, e.stack);
      if (!e.message.includes('Build was canceled')) {
        await this.buildService.setBuildStatus(build.id, BuildStatus.FAILED, job.data.additionalInfos);
      }
    }

    const endTime = new Date().getTime();
    this.logger.debug(`Finished processing job ${job.id} of type ${job.name} with data ${job.data} in ${endTime - startTime}ms`);
  }
}
