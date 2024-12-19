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
    if (release && input?.object_attributes.action !== 'create') {
      return true;
    }

    const source = push ? input.ref.split('/')[2] : input.tag;
    const id = input?.project?.id ?? input?.repository?.full_name;
    const containers = await this.containerService.getContainerForWebhook(id, source);

    // check if no containers found
    if (!containers?.length) {
      return true;
    }

    // only push webhook includes commits
    if (push) {
      const skipCommit = input.commits.find(commit => commit.message.includes('[skip ci]'));
      if (skipCommit) {
        return true;
      }
    }

    // notify project subscribers
    const project = await this.projectService.getProjectByContainer(containers[0]);
    const capitalizedProjectName = project.name.charAt(0).toUpperCase() + project.name.slice(1)
    await this.webPushService.notifyProjectSubs(project.id, {
      title: 'Build',
      body: `${capitalizedProjectName} build started...`,
      image: 'https://lennetech.app/notification.png'
    });

    // loop through containers
    for (const container of containers) {
      // check if container is auto deploy
      if (!container.autoDeploy) {
        continue;
      }

      // only push webhook includes commits
      if (push) {
        // check if push has more or equal 20 commits if not check is commit includes changed files contain container.baseDir
        if (input.commits.length < 20 &&
          container.baseDir &&
          container.baseDir !== '.' &&
          !input.commits.some(commit =>
            commit.modified.some(file => file.includes(container.baseDir.replace('./', ''))) ||
            commit.added.some(file => file.includes(container.baseDir.replace('./', ''))) ||
            commit.removed.some(file => file.includes(container.baseDir.replace('./', ''))))) {
          console.debug('No changes in container', container.id);
          continue;
        }
      }

      // check if container is draft, stopped or stopped by system and skip
      if (container.status === ContainerStatus.STOPPED ||
        container.status === ContainerStatus.DRAFT ||
        container.status === ContainerStatus.STOPPED_BY_SYSTEM) {
        continue;
      }

      // create build (queue handler will start build)
      await this.buildService.create({
        container: container.id,
      });
    }

    return true;
  }
}
