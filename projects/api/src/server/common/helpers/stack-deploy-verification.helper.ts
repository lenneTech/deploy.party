/**
 * Decision logic for the check after `docker stack deploy` (DEV-4068).
 *
 * `docker stack deploy` returns as soon as Swarm has accepted the new service specs. Whether the new
 * version actually came up, or Swarm rolled it back, only shows afterwards. This module decides from
 * what docker reports (pure functions, no docker calls); DockerService polls and feeds them.
 */

/**
 * Default time to wait for a deploy to settle: the healthcheck window of a NODE container
 * (5 s interval x 60 retries) plus 2 minutes for pulling, starting and a possible rollback.
 * Configurable with NSC__DEPLOY_VERIFY_TIMEOUT_SECONDS.
 */
export const DEFAULT_DEPLOY_VERIFY_TIMEOUT_SECONDS = 5 * 60 + 120;

/**
 * How long to wait for Swarm to start the rolling update before the running tasks alone decide.
 * Swarm starts an update within moments of the deploy. Until it has started, the old tasks still
 * run and would wrongly count as the new version.
 */
export const UPDATE_START_GRACE_MS = 15000;

/**
 * Tolerance between the clock of this process and the timestamps of the Swarm leader, which may be
 * another manager node.
 */
const CLOCK_TOLERANCE_MS = 2000;

/** Pause between two polls of the stack. */
export const STACK_VERIFY_POLL_MS = 3000;

/** Log lines of a failed task shown in the build log. */
export const FAILED_TASK_LOG_LINES = 30;

/**
 * Thrown by the build when the verification failed. The reason and the task error are already in
 * the build log at that point, so the error itself carries nothing worth logging again.
 */
export class StackDeployVerificationError extends Error {
  constructor() {
    super('The new version did not start or did not become healthy');
    this.name = 'StackDeployVerificationError';
  }
}

/** The parts of `docker service inspect` that matter here. */
export interface SwarmServiceInspect {
  Spec?: { Name?: string };
  UpdateStatus?: { CompletedAt?: string; Message?: string; StartedAt?: string; State?: string };
}

export interface ServiceReplicas {
  desired: number;
  /** Set for a job service whose runs have all completed; it has no running tasks by design. */
  jobCompleted?: boolean;
  running: number;
}

export interface StackService {
  name: string;
  replicas: ServiceReplicas | null;
}

export type DeployCheckState = 'failed' | 'ok' | 'pending';

export interface DeployCheck {
  detail: string;
  state: DeployCheckState;
}

export interface StackDeployVerdict extends DeployCheck {
  /** Services that failed, or on a timeout the ones still pending; their tasks are worth a look. */
  services: string[];
}

export interface SwarmTask {
  CurrentState?: string;
  DesiredState?: string;
  Error?: string;
  ID?: string;
  Image?: string;
  Name?: string;
}

/**
 * Timeout in milliseconds from the configured value in seconds; the default for anything that is
 * not a positive number.
 */
export function resolveDeployVerifyTimeoutMs(seconds: unknown): number {
  const value = typeof seconds === 'string' ? Number(seconds) : seconds;
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value * 1000
    : DEFAULT_DEPLOY_VERIFY_TIMEOUT_SECONDS * 1000;
}

/**
 * State of one service after the deploy.
 *
 * - An update that started with this deploy decides by its state: `completed` is ok;
 *   `rollback_completed`, `paused` and `rollback_paused` failed; `updating` and `rollback_started`
 *   are still moving (a started rollback ends as rollback_completed, which then fails).
 * - An older update status belongs to an earlier deploy and is ignored, otherwise the result of
 *   the last deploy would decide this one.
 * - Without an update of this deploy (new service, or a deploy that changed no task) the service
 *   is ok when all desired tasks run. Swarm reports a task with a healthcheck as running only once
 *   it is healthy, so this covers the healthcheck too. The running tasks only count after
 *   UPDATE_START_GRACE_MS, because an update that has not started yet still shows the old tasks.
 */
export function evaluateServiceDeploy(input: {
  deployStartedAt: Date;
  inspect: SwarmServiceInspect;
  now: Date;
  replicas: ServiceReplicas | null;
  verifyStartedAt: Date;
}): DeployCheck {
  const { deployStartedAt, inspect, now, replicas, verifyStartedAt } = input;
  const update = inspect?.UpdateStatus;
  const updateStartedAt = Date.parse(update?.StartedAt ?? '');
  const message = update?.Message ? ` (${update.Message})` : '';

  if (update?.State && updateStartedAt >= deployStartedAt.getTime() - CLOCK_TOLERANCE_MS) {
    switch (update.State) {
      case 'completed':
        return { state: 'ok', detail: 'update completed' };
      case 'updating':
        return { state: 'pending', detail: 'update in progress' };
      case 'rollback_started':
        return { state: 'pending', detail: `rolling back to the previous version${message}` };
      case 'rollback_completed':
        return { state: 'failed', detail: `rolled back to the previous version${message}` };
      case 'paused':
        return { state: 'failed', detail: `update paused${message}` };
      case 'rollback_paused':
        return { state: 'failed', detail: `rollback paused${message}` };
      default:
        return { state: 'pending', detail: `update state ${update.State}${message}` };
    }
  }

  if (now.getTime() - verifyStartedAt.getTime() < UPDATE_START_GRACE_MS) {
    return { state: 'pending', detail: 'waiting for Swarm to start the update' };
  }

  if (!replicas) {
    return { state: 'pending', detail: 'task count unknown' };
  }

  if (replicas.jobCompleted) {
    return { state: 'ok', detail: 'job completed' };
  }

  const tasks = `${replicas.running}/${replicas.desired} tasks running`;
  return replicas.running >= replicas.desired ? { state: 'ok', detail: tasks } : { state: 'pending', detail: tasks };
}

/**
 * Overall verdict for the stack: failed as soon as one service failed, ok when all are ok, and
 * failed on a timeout while anything is still pending. A stack without services after the grace
 * period failed too: then `docker stack deploy` created nothing that could run.
 */
export function summarizeStackDeploy(input: {
  checks: { check: DeployCheck; service: string }[];
  now: Date;
  timeoutMs: number;
  verifyStartedAt: Date;
}): StackDeployVerdict {
  const { checks, now, timeoutMs, verifyStartedAt } = input;
  const elapsed = now.getTime() - verifyStartedAt.getTime();
  const timedOut = elapsed >= timeoutMs;
  const describe = (list: typeof checks) => list.map(({ check, service }) => `${service}: ${check.detail}`).join('; ');

  if (!checks.length) {
    if (elapsed >= UPDATE_START_GRACE_MS || timedOut) {
      return { state: 'failed', detail: 'no services found in the stack', services: [] };
    }
    return { state: 'pending', detail: 'waiting for the services of the stack', services: [] };
  }

  const failed = checks.filter(({ check }) => check.state === 'failed');
  if (failed.length) {
    return { state: 'failed', detail: describe(failed), services: failed.map(({ service }) => service) };
  }

  const pending = checks.filter(({ check }) => check.state === 'pending');
  if (!pending.length) {
    return { state: 'ok', detail: describe(checks), services: [] };
  }

  if (timedOut) {
    return {
      state: 'failed',
      detail: `not healthy after ${Math.round(timeoutMs / 1000)} s: ${describe(pending)}`,
      services: pending.map(({ service }) => service),
    };
  }

  return { state: 'pending', detail: describe(pending), services: pending.map(({ service }) => service) };
}

/**
 * Services of `docker stack services <stack> --format '{{json .}}'`, one JSON object per line.
 */
export function parseStackServices(stdout: string): StackService[] {
  return parseJsonLines<{ Name?: string; Replicas?: string }>(stdout)
    .filter((service) => service.Name)
    .map((service) => ({ name: service.Name, replicas: parseReplicas(service.Replicas) }));
}

/**
 * Replicas column of `docker service ls`: "1/1", "0/1", "1/1 (max 1 per node)" or, for jobs,
 * "0/1 (1/1 completed)". Running before the slash, desired after it.
 */
export function parseReplicas(value: string | undefined): ServiceReplicas | null {
  const match = /^\s*(\d+)\/(\d+)/.exec(value ?? '');
  if (!match) {
    return null;
  }

  const replicas: ServiceReplicas = { running: Number(match[1]), desired: Number(match[2]) };
  const job = /\((\d+)\/(\d+) completed\)/.exec(value);
  if (job && Number(job[1]) >= Number(job[2])) {
    replicas.jobCompleted = true;
  }
  return replicas;
}

/**
 * The task worth showing after a failed deploy, from `docker service ps --no-trunc --format '{{json .}}'`.
 * Docker lists the tasks of each slot newest first, so this is the most recent task that reports an
 * error (for example "task: non-zero exit (1)"), or else the most recent failed or rejected one.
 */
export function pickFailedTask(stdout: string): SwarmTask | null {
  const tasks = parseJsonLines<SwarmTask>(stdout);
  return (
    tasks.find((task) => task.Error?.trim()) ??
    tasks.find((task) => /^(failed|rejected)\b/i.test(task.CurrentState ?? '')) ??
    null
  );
}

/**
 * The last `maxLines` lines of a task log for the build log: without ANSI colour codes and empty
 * lines, each line cut to `maxLineLength` characters, so a single huge line cannot flood the log.
 */
export function tailTaskLog(output: string, maxLines = 30, maxLineLength = 500): string[] {
  return (output ?? '')
    .replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '')
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim())
    .slice(-maxLines)
    .map((line) => (line.length > maxLineLength ? `${line.slice(0, maxLineLength)} …` : line));
}

function parseJsonLines<T>(stdout: string): T[] {
  const result: T[] = [];
  for (const line of (stdout ?? '').split('\n')) {
    if (!line.trim()) {
      continue;
    }
    try {
      result.push(JSON.parse(line));
    } catch {
      // Docker prints notes such as "Nothing found in stack: x" between or instead of JSON lines.
    }
  }
  return result;
}
