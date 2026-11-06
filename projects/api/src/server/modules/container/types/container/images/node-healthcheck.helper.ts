/**
 * HEALTHCHECK line for the Dockerfile of a NODE container (DEV-4068).
 *
 * Without a healthcheck Swarm counts a task as running as soon as the process starts. With
 * `order: start-first` the old task is then removed at once, and a new version that crashes on
 * start takes the stage down. With a healthcheck Swarm keeps the new task in `starting` until the
 * check passes, the old task keeps serving, and a crash before that rolls the update back.
 *
 * - A container with its own `healthCheckCmd` keeps exactly the line it had before.
 * - Every other NODE container gets a TCP check on its port. Deliberately not HTTP: an HTTP check
 *   could mark a healthy app unhealthy (for example an SSR page that answers 500 while its API is
 *   down) and roll back a good deploy. The check runs with `node` itself, because every NODE build
 *   image has node, while curl or wget are not guaranteed. It connects to 127.0.0.1 and not to
 *   `localhost`, since node may resolve `localhost` to ::1 and miss an app that listens on IPv4 only.
 * - Without a valid port there is nothing to check, and no line is added rather than a broken one.
 */
export function buildNodeHealthcheck(container: { healthCheckCmd?: string; port?: number | string }): string | null {
  const options = '--interval=5s --retries=60';

  if (container.healthCheckCmd) {
    return `HEALTHCHECK ${options} CMD ${container.healthCheckCmd} || exit 1`;
  }

  const port = parsePort(container.port);
  if (!port) {
    return null;
  }

  const script =
    `require('net').connect(${port},'127.0.0.1')` +
    `.on('connect',()=>process.exit(0))` +
    `.on('error',()=>process.exit(1))`;

  // Exec form: no shell is involved, so the script needs no shell quoting. JSON.stringify produces
  // exactly the JSON array syntax the Dockerfile exec form expects.
  return `HEALTHCHECK ${options} CMD ${JSON.stringify(['node', '-e', script])}`;
}

/**
 * The port is a free-form string in the database. Only a plain TCP port number may end up in the
 * Dockerfile; anything else returns null.
 */
function parsePort(value: number | string | undefined): number | null {
  const text = String(value ?? '').trim();
  if (!/^\d{1,5}$/.test(text)) {
    return null;
  }

  const port = Number(text);
  return port >= 1 && port <= 65535 ? port : null;
}
