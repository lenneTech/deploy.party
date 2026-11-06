import {
  DEFAULT_DEPLOY_VERIFY_TIMEOUT_SECONDS,
  evaluateServiceDeploy,
  parseReplicas,
  parseStackServices,
  pickFailedTask,
  resolveDeployVerifyTimeoutMs,
  summarizeStackDeploy,
  SwarmServiceInspect,
  tailTaskLog,
  UPDATE_START_GRACE_MS,
} from './stack-deploy-verification.helper';

/**
 * DEV-4068: the build reported SUCCESS as soon as `docker stack deploy` returned, even when the new
 * version crashed on start and Swarm rolled it back or the stage stayed down. These tests cover the
 * decision that now follows the deploy.
 */
describe('verification after docker stack deploy', () => {
  const deployStartedAt = new Date('2026-11-06T18:00:00.000Z');
  const verifyStartedAt = new Date('2026-11-06T18:00:05.000Z');
  const afterGrace = new Date(verifyStartedAt.getTime() + UPDATE_START_GRACE_MS + 1000);
  const withinGrace = new Date(verifyStartedAt.getTime() + 2000);

  /** Docker reports timestamps with nanoseconds. */
  const thisDeploy = '2026-11-06T18:00:03.123456789Z';
  const earlierDeploy = '2026-11-05T09:12:44.987654321Z';

  const update = (State: string, StartedAt = thisDeploy, Message?: string): SwarmServiceInspect => ({
    Spec: { Name: 'abc_app' },
    UpdateStatus: { State, StartedAt, Message },
  });

  const evaluate = (inspect: SwarmServiceInspect, replicas = { running: 1, desired: 1 }, now = afterGrace) =>
    evaluateServiceDeploy({ deployStartedAt, inspect, now, replicas, verifyStartedAt });

  describe('a service whose update started with this deploy', () => {
    it('is ok once the update completed', () => {
      expect(evaluate(update('completed'), { running: 1, desired: 1 }, withinGrace)).toEqual({ state: 'ok', detail: 'update completed' });
    });

    it('failed when Swarm rolled the update back (the image exits 1 on start)', () => {
      const result = evaluate(update('rollback_completed', thisDeploy, 'rollback completed'));

      expect(result.state).toBe('failed');
      expect(result.detail).toBe('rolled back to the previous version (rollback completed)');
    });

    it('failed when the update or the rollback was paused', () => {
      expect(evaluate(update('paused', thisDeploy, 'update paused due to failure or early termination of task x')).state).toBe('failed');
      expect(evaluate(update('rollback_paused')).state).toBe('failed');
    });

    it('is pending while updating or rolling back, a rollback only fails once it is complete', () => {
      expect(evaluate(update('updating')).state).toBe('pending');
      expect(evaluate(update('rollback_started', thisDeploy, 'update rolled back due to failure'))).toEqual({
        state: 'pending',
        detail: 'rolling back to the previous version (update rolled back due to failure)',
      });
    });

    it('does not count running tasks while the update is still in progress', () => {
      // During a start-first update the old task still runs; that is not the new version.
      expect(evaluate(update('updating'), { running: 1, desired: 1 }).state).toBe('pending');
    });

    it('is pending for an unknown update state', () => {
      expect(evaluate(update('something_new')).state).toBe('pending');
    });
  });

  describe('a service without an update of this deploy', () => {
    it('ignores the update status of an earlier deploy, even a rollback', () => {
      expect(evaluate(update('rollback_completed', earlierDeploy))).toEqual({ state: 'ok', detail: '1/1 tasks running' });
      expect(evaluate(update('completed', earlierDeploy), { running: 0, desired: 1 }).state).toBe('pending');
    });

    it('is ok on a first deploy when all desired tasks run', () => {
      expect(evaluate({ Spec: { Name: 'abc_app' } }, { running: 2, desired: 2 })).toEqual({ state: 'ok', detail: '2/2 tasks running' });
      expect(evaluate({}, { running: 0, desired: 0 }).state).toBe('ok');
    });

    it('is pending while not all desired tasks run (a healthcheck task counts only once healthy)', () => {
      expect(evaluate({}, { running: 0, desired: 1 })).toEqual({ state: 'pending', detail: '0/1 tasks running' });
    });

    it('waits for Swarm to start the update before the running tasks count', () => {
      expect(evaluate(update('completed', earlierDeploy), { running: 1, desired: 1 }, withinGrace)).toEqual({
        state: 'pending',
        detail: 'waiting for Swarm to start the update',
      });
    });

    it('is pending when the task count is unknown', () => {
      expect(evaluate({}, null).state).toBe('pending');
    });
  });

  describe('the stack as a whole', () => {
    const ok = { state: 'ok' as const, detail: 'update completed' };
    const pending = { state: 'pending' as const, detail: '0/1 tasks running' };
    const failed = { state: 'failed' as const, detail: 'rolled back to the previous version' };
    const timeoutMs = 420000;
    const summarize = (checks: { check: typeof ok | typeof pending | typeof failed; service: string }[], now = afterGrace) =>
      summarizeStackDeploy({ checks, now, timeoutMs, verifyStartedAt });

    it('is ok when every service is ok', () => {
      expect(summarize([{ service: 'abc_app', check: ok }, { service: 'abc_worker', check: ok }]).state).toBe('ok');
    });

    it('fails as soon as one service failed and names it', () => {
      expect(summarize([{ service: 'abc_app', check: failed }, { service: 'abc_worker', check: pending }])).toEqual({
        state: 'failed',
        detail: 'abc_app: rolled back to the previous version',
        services: ['abc_app'],
      });
    });

    it('waits while a service is pending and fails it on the timeout', () => {
      const checks = [{ service: 'abc_app', check: ok }, { service: 'abc_worker', check: pending }];

      expect(summarize(checks).state).toBe('pending');
      expect(summarize(checks, new Date(verifyStartedAt.getTime() + timeoutMs))).toEqual({
        state: 'failed',
        detail: 'not healthy after 420 s: abc_worker: 0/1 tasks running',
        services: ['abc_worker'],
      });
    });

    it('fails a stack without services after the grace period', () => {
      expect(summarize([], withinGrace).state).toBe('pending');
      expect(summarize([], afterGrace)).toEqual({ state: 'failed', detail: 'no services found in the stack', services: [] });
    });
  });

  describe('timeout configuration', () => {
    it('defaults to the healthcheck window of 5 s x 60 plus 2 minutes', () => {
      expect(DEFAULT_DEPLOY_VERIFY_TIMEOUT_SECONDS).toBe(420);
      for (const value of [undefined, null, 0, -5, 'abc', NaN, {}]) {
        expect(resolveDeployVerifyTimeoutMs(value)).toBe(420000);
      }
    });

    it('takes a configured number of seconds, also as string', () => {
      expect(resolveDeployVerifyTimeoutMs(600)).toBe(600000);
      expect(resolveDeployVerifyTimeoutMs('90')).toBe(90000);
    });
  });

  describe('parsing docker output', () => {
    it('reads the services of a stack with their replicas', () => {
      const stdout = [
        '{"ID":"k2x","Image":"localhost:5000/abc:main","Mode":"replicated","Name":"abc_app","Ports":"","Replicas":"0/1"}',
        '{"ID":"m7q","Image":"redis:7","Mode":"replicated","Name":"abc_redis","Ports":"","Replicas":"1/1 (max 1 per node)"}',
        '',
      ].join('\n');

      expect(parseStackServices(stdout)).toEqual([
        { name: 'abc_app', replicas: { running: 0, desired: 1 } },
        { name: 'abc_redis', replicas: { running: 1, desired: 1 } },
      ]);
    });

    it('reads no services from the note docker prints for an empty stack', () => {
      expect(parseStackServices('Nothing found in stack: abc')).toEqual([]);
      expect(parseStackServices('')).toEqual([]);
    });

    it('reads every replicas format and nothing else', () => {
      expect(parseReplicas('3/3')).toEqual({ running: 3, desired: 3 });
      expect(parseReplicas('0/1 (1/1 completed)')).toEqual({ running: 0, desired: 1, jobCompleted: true });
      expect(parseReplicas('1/1 (0/1 completed)')).toEqual({ running: 1, desired: 1 });
      expect(parseReplicas('')).toBeNull();
      expect(parseReplicas(undefined)).toBeNull();
    });

    it('treats a completed job service as ok although none of its tasks runs', () => {
      expect(evaluate({}, parseReplicas('0/1 (1/1 completed)'))).toEqual({ state: 'ok', detail: 'job completed' });
      expect(evaluate({}, parseReplicas('0/1 (0/1 completed)')).state).toBe('pending');
    });

    it('picks the newest task that reports an error', () => {
      const stdout = [
        '{"CurrentState":"Running 10 seconds ago","DesiredState":"Running","Error":"","ID":"t3","Image":"app:old","Name":"abc_app.1"}',
        '{"CurrentState":"Failed 20 seconds ago","DesiredState":"Shutdown","Error":"task: non-zero exit (1)","ID":"t2","Image":"app:new","Name":"abc_app.1"}',
        '{"CurrentState":"Failed 40 seconds ago","DesiredState":"Shutdown","Error":"task: non-zero exit (137)","ID":"t1","Image":"app:new","Name":"abc_app.1"}',
      ].join('\n');

      expect(pickFailedTask(stdout)).toMatchObject({ ID: 't2', Error: 'task: non-zero exit (1)' });
    });

    it('falls back to a failed or rejected task without error text and finds nothing in healthy output', () => {
      const rejected = '{"CurrentState":"Rejected 5 seconds ago","DesiredState":"Shutdown","Error":"","ID":"t9","Name":"abc_app.1"}';
      const running = '{"CurrentState":"Running 1 minute ago","DesiredState":"Running","Error":"","ID":"t1","Name":"abc_app.1"}';

      expect(pickFailedTask([running, rejected].join('\n'))).toMatchObject({ ID: 't9' });
      expect(pickFailedTask(running)).toBeNull();
      expect(pickFailedTask('')).toBeNull();
    });

    it('keeps the last 30 log lines without colour codes, each capped in length', () => {
      const lines = Array.from({ length: 50 }, (_, i) => `line ${i + 1}`);
      lines.push('\u001b[31mError: NODE_ENV "prod" is not a known environment\u001b[39m', '', 'x'.repeat(2000));

      const tail = tailTaskLog(lines.join('\n'));

      expect(tail).toHaveLength(30);
      expect(tail[0]).toBe('line 23');
      expect(tail[28]).toBe('Error: NODE_ENV "prod" is not a known environment');
      expect(tail[29]).toBe(`${'x'.repeat(500)} …`);
      expect(tailTaskLog(undefined)).toEqual([]);
    });
  });
});
