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

  function setup(clone: () => Promise<boolean>, refreshBuildFiles = jest.fn().mockResolvedValue([{ file: 'Dockerfile', state: 'unchanged' }])) {
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
    const dockerService = { refreshBuildFiles };
    const processor = new BuildProcessor(buildService as any, containerService as any, dockerService as any, {} as any);
    return { buildService, dockerService, processor };
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

  /**
   * DEV-4068: builds write Dockerfile and compose file from the container settings, but only on an
   * instance that switched it on after the drift check.
   */
  describe('build files', () => {
    const original = process.env.NSC__REFRESH_BUILD_FILES;

    afterEach(() => {
      if (original === undefined) {
        delete process.env.NSC__REFRESH_BUILD_FILES;
      } else {
        process.env.NSC__REFRESH_BUILD_FILES = original;
      }
    });

    it('leaves the files on disk alone while the instance has not switched it on', async () => {
      delete process.env.NSC__REFRESH_BUILD_FILES;
      const { buildService, dockerService, processor } = setup(async () => true);

      await processor.build(job);

      expect(dockerService.refreshBuildFiles).not.toHaveBeenCalled();
      expect(buildService.triggerBuild).toHaveBeenCalled();
    });

    it('writes the files before building and logs the outcome', async () => {
      process.env.NSC__REFRESH_BUILD_FILES = 'true';
      const { buildService, dockerService, processor } = setup(async () => true);

      await processor.build(job);

      expect(dockerService.refreshBuildFiles).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1' }));
      expect(buildService.updateBuildLog).toHaveBeenCalledWith('b1', 'Build files match the container settings', 'info');
      expect(dockerService.refreshBuildFiles.mock.invocationCallOrder[0]).toBeLessThan(buildService.triggerBuild.mock.invocationCallOrder[0]);
    });

    it('does not touch the files when the clone failed', async () => {
      process.env.NSC__REFRESH_BUILD_FILES = 'true';
      const { dockerService, processor } = setup(async () => false);

      await processor.build(job);

      expect(dockerService.refreshBuildFiles).not.toHaveBeenCalled();
    });

    it('still builds with the files on disk when writing them fails', async () => {
      process.env.NSC__REFRESH_BUILD_FILES = 'true';
      const { buildService, processor } = setup(async () => true, jest.fn().mockRejectedValue(new Error('disk full')));

      await processor.build(job);

      expect(buildService.updateBuildLog).toHaveBeenCalledWith(
        'b1',
        'Could not write the build files from the container settings, building with the files on disk: disk full',
        'error',
      );
      expect(buildService.triggerBuild).toHaveBeenCalledWith('c1', 'b1', job.data.additionalInfos);
    });
  });
});
