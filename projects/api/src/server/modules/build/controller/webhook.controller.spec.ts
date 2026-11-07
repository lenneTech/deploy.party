import { UnauthorizedException } from '@nestjs/common';
import { WebhookController } from './webhook.controller';

// Only injection tokens; the services are stubbed per test.
jest.mock('../build.service', () => ({ BuildService: class BuildService {} }));
jest.mock('../../container/container.service', () => ({ ContainerService: class ContainerService {} }));
jest.mock('../../project/project.service', () => ({ ProjectService: class ProjectService {} }));
jest.mock('../../web-push/web-push.service', () => ({ WebPushService: class WebPushService {} }));

/**
 * DEV-4068: the webhook builds a container only for a request that carries the secret of the
 * container's source, once the instance enforces it. Before that it reports, so that hooks without
 * the secret can be found first.
 */
describe('webhook token check', () => {
  const secret = 'a'.repeat(64);
  const push = {
    commits: [{ added: [], message: 'feat: x', modified: ['src/a.ts'], removed: [] }],
    object_kind: 'push',
    project: { id: 98 },
    ref: 'refs/heads/main',
  };
  const original = process.env.NSC__WEBHOOK_TOKEN_MODE;

  function setup(containers: any[]) {
    const buildService = { create: jest.fn().mockResolvedValue({}) };
    const containerService = {
      getContainerForWebhook: jest.fn().mockResolvedValue(containers),
      update: jest.fn().mockResolvedValue({}),
    };
    const projectService = { getProjectByContainer: jest.fn().mockResolvedValue({ id: 'p1', name: 'docs' }) };
    const webPushService = { notifyProjectSubs: jest.fn().mockResolvedValue(undefined) };
    const controller = new WebhookController(buildService as any, containerService as any, projectService as any, webPushService as any);
    const warn = jest.spyOn((controller as any).logger, 'warn').mockImplementation(() => undefined);
    return { buildService, containerService, controller, warn };
  }

  const container = (id: string, webhookSecret?: string, extra: Record<string, unknown> = {}) => ({
    autoDeploy: true,
    baseDir: '.',
    deploymentType: 'BRANCH',
    id,
    source: { webhookSecret },
    status: 'DEPLOYED',
    ...extra,
  });

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NSC__WEBHOOK_TOKEN_MODE;
    } else {
      process.env.NSC__WEBHOOK_TOKEN_MODE = original;
    }
  });

  it('builds without any check while the instance has not switched it on', async () => {
    delete process.env.NSC__WEBHOOK_TOKEN_MODE;
    const { buildService, controller, warn } = setup([container('c1', secret)]);

    await controller.triggerBuild(push);

    expect(buildService.create).toHaveBeenCalledWith({ container: 'c1' });
    expect(warn).not.toHaveBeenCalled();
  });

  it('in report mode builds and logs a request without the secret, never the token', async () => {
    process.env.NSC__WEBHOOK_TOKEN_MODE = 'report';
    const { buildService, controller, warn } = setup([container('c1', secret)]);

    await controller.triggerBuild(push, 'wrong-token');

    expect(buildService.create).toHaveBeenCalledWith({ container: 'c1' });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('a wrong X-Gitlab-Token for container c1; accepted (report mode)'));
    expect(JSON.stringify(warn.mock.calls)).not.toContain('wrong-token');
  });

  it('in enforce mode builds for the right secret', async () => {
    process.env.NSC__WEBHOOK_TOKEN_MODE = 'enforce';
    const { buildService, controller, warn } = setup([container('c1', secret)]);

    await controller.triggerBuild(push, secret);

    expect(buildService.create).toHaveBeenCalledWith({ container: 'c1' });
    expect(warn).not.toHaveBeenCalled();
  });

  it('in enforce mode refuses a request without the secret with 401 and builds nothing', async () => {
    process.env.NSC__WEBHOOK_TOKEN_MODE = 'enforce';
    const { buildService, controller } = setup([container('c1', secret)]);

    await expect(controller.triggerBuild(push)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(buildService.create).not.toHaveBeenCalled();
  });

  it('in enforce mode builds only the containers whose source the secret belongs to', async () => {
    process.env.NSC__WEBHOOK_TOKEN_MODE = 'enforce';
    const { buildService, controller } = setup([container('c1', secret), container('c2', 'b'.repeat(64))]);

    await controller.triggerBuild(push, secret);

    expect(buildService.create).toHaveBeenCalledTimes(1);
    expect(buildService.create).toHaveBeenCalledWith({ container: 'c1' });
  });

  it('in enforce mode does not let a request without the secret change the tag of a pattern container', async () => {
    process.env.NSC__WEBHOOK_TOKEN_MODE = 'enforce';
    const release = { action: 'create', object_kind: 'release', project: { id: 98 }, tag: 'v0.0.1-old' };
    const { containerService, controller } = setup([container('c1', secret, { deploymentType: 'TAG', tagMatchType: 'PATTERN' })]);

    await expect(controller.triggerBuild(release, 'nope')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(containerService.update).not.toHaveBeenCalled();
  });

  it('never matches a source without a secret, even for an empty token', async () => {
    process.env.NSC__WEBHOOK_TOKEN_MODE = 'enforce';
    const { controller } = setup([container('c1', undefined)]);

    await expect(controller.triggerBuild(push, '')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
