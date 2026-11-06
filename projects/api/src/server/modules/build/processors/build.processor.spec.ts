import { BuildProcessor } from './build.processor';

// The processor only needs these as injection tokens. Mocking them keeps the test free of
// nest-server, mongoose and native modules; the services themselves are stubbed per test below.
jest.mock('../build.service', () => ({ BuildService: class BuildService {} }));
jest.mock('../../container/container.service', () => ({ ContainerService: class ContainerService {} }));
jest.mock('../../../common/services/docker.service', () => ({ DockerService: class DockerService {} }));
jest.mock('../../../common/services/file.service', () => ({ FileService: class FileService {} }));
jest.mock('../../../../config.env', () => ({ __esModule: true, default: { buildConcurrency: 2 } }));

/**
 * DEV-4068: `cloneGitLab` caught a failed clone, set FAILED and returned normally, so the processor
 * went on to `triggerBuild` and built stale or empty code, which could end in SUCCESS.
 */
describe('build processor after the clone', () => {
  const job = { id: 'b1', name: 'build', data: { buildId: 'b1', containerId: 'c1', additionalInfos: { callbackUrl: 'https://ci.example.com/cb' } } } as any;

  function setup(clone: () => Promise<boolean>) {
    const buildService = {
      cloneGitLab: jest.fn(clone),
      getForce: jest.fn().mockResolvedValue({ id: 'b1' }),
      setBuildStatus: jest.fn().mockResolvedValue(undefined),
      triggerBuild: jest.fn().mockResolvedValue(true),
      updateBuildLog: jest.fn().mockResolvedValue(undefined),
    };
    const containerService = {
      getForce: jest.fn().mockResolvedValue({ id: 'c1', source: { token: 'secret' } }),
    };
    const processor = new BuildProcessor(buildService as any, containerService as any, {} as any, {} as any);
    return { buildService, processor };
  }

  it('does not build when the clone failed', async () => {
    const { buildService, processor } = setup(async () => false);

    await processor.build(job);

    expect(buildService.cloneGitLab).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'secret', job.data.additionalInfos);
    expect(buildService.triggerBuild).not.toHaveBeenCalled();
    expect(buildService.updateBuildLog).toHaveBeenCalledWith('b1', 'Build stopped before building: the source was not cloned', 'error');
  });

  it('does not build when the build was canceled during the clone', async () => {
    const { buildService, processor } = setup(async () => {
      throw new Error('Build was canceled');
    });

    await processor.build(job);

    expect(buildService.triggerBuild).not.toHaveBeenCalled();
    // A canceled build keeps its status; the processor sets FAILED only for other errors.
    expect(buildService.setBuildStatus).not.toHaveBeenCalled();
  });

  it('builds after a successful clone', async () => {
    const { buildService, processor } = setup(async () => true);

    await processor.build(job);

    expect(buildService.triggerBuild).toHaveBeenCalledWith('c1', 'b1', job.data.additionalInfos);
  });
});
