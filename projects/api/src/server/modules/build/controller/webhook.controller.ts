import {Body, Controller, Post} from '@nestjs/common';
import {ContainerService} from '../../container/container.service';
import {BuildService} from '../build.service';
import {ContainerStatus} from "../../container/enums/container-status.enum";
import {ProjectService} from "../../project/project.service";
import {WebPushService} from "../../web-push/web-push.service";

@Controller('webhook')
export class WebhookController {
  constructor(
    protected buildService: BuildService,
    private containerService: ContainerService,
    private projectService: ProjectService,
    private webPushService: WebPushService,
  ) {}

  @Post()
  async triggerBuild(@Body() input: any) {
    // check if release or push webhook
    const release = input?.object_kind === 'release';
    const push = input?.object_kind === 'push';

    // check if not push or release
    if (!push && !release) {
      return true;
    }

    // check if release is not create action
    if (release && input?.action !== 'create') {
      return true;
    }

    const source = push ? input.ref.split('/')[2] : input.tag;
    const id = input?.project?.id ?? input?.repository?.full_name;
    const containers = await this.containerService.getContainerForWebhook(id, source);

    // check if no containers found
    if (!containers?.length) {
      return true;
    }

    const containersToProcess = [];

    // loop through containers and filter which ones should be processed
    for (const container of containers) {
      // check if container is auto deploy
      if (!container.autoDeploy) {
        continue;
      }

      // check if container is draft, stopped or stopped by system and skip
      if (container.status === ContainerStatus.STOPPED ||
        container.status === ContainerStatus.DRAFT ||
        container.status === ContainerStatus.STOPPED_BY_SYSTEM) {
        continue;
      }

      // Check for skip CI per container
      if (this.shouldSkipCIForContainer(input, push, release, container)) {
        console.debug('Skipping CI for container', container.id);
        continue;
      }

      // only push webhook includes commits - check for file changes
      if (push) {
        // check if push has more or equal 20 commits if not check is commit includes changed files contain container.baseDir
        if (input.commits.length < 20 &&
          container.baseDir &&
          container.baseDir !== '.' &&
          !input.commits.some(commit =>
            commit.modified.some(file => file.includes(container.baseDir.replace('./', ''))) ||
            commit.added.some(file => file.includes(container.baseDir.replace('./', ''))) ||
            commit.removed.some(file => file.includes(container.baseDir.replace('./', ''))))) {
          console.debug('No changes in container baseDir', container.id);
          continue;
        }
      }

      containersToProcess.push(container);
    }

    // check if no containers to process
    if (!containersToProcess.length) {
      return true;
    }

    // notify project subscribers only if we have containers to process
    const project = await this.projectService.getProjectByContainer(containersToProcess[0]);
    const capitalizedProjectName = project.name.charAt(0).toUpperCase() + project.name.slice(1);
    await this.webPushService.notifyProjectSubs(project.id, {
      title: 'Build',
      body: `${capitalizedProjectName} build started...`,
      image: 'https://lennetech.app/notification.png'
    });

    // create builds for filtered containers
    for (const container of containersToProcess) {
      await this.buildService.create({
        container: container.id,
      });
    }

    return true;
  }

  /**
   * Check if CI should be skipped for a specific container
   * Uses container-specific skip patterns for flexible CI control
   */
  private shouldSkipCIForContainer(input: any, push: boolean, tag: boolean, container: any): boolean {
    // Get skip patterns for this specific container
    const skipPatterns = container.skipCiPatterns?.length
      ? container.skipCiPatterns
      : ['[skip ci]', '[ci skip]', '[no ci]', '[skip build]'];

    if (push && input.commits) {
      // Check commit messages for skip patterns
      const skipCommit = input.commits.find((commit: any) =>
        skipPatterns.some(pattern => commit.message.includes(pattern))
      );
      if (skipCommit) {
        console.debug('Skipping CI for container due to commit message:', container.id, skipCommit.message);
        return true;
      }
    }

    if (tag) {
      // Check tag name for skip patterns
      if (input.tag && skipPatterns.some(pattern => input.tag.includes(pattern))) {
        console.debug('Skipping CI for container due to tag name:', container.id, input.tag);
        return true;
      }

      // Check tag description/message for skip patterns
      const tagDescription = input?.description ||
                            input?.commit?.message ||
                            input?.commit?.title || '';

      if (tagDescription && skipPatterns.some(pattern => tagDescription.includes(pattern))) {
        console.debug('Skipping CI for container due to tag description:', container.id, tagDescription);
        return true;
      }
    }

    return false;
  }
}
