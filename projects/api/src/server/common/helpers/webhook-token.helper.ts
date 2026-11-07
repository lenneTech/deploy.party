import { createHash, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Secret for the webhook (DEV-4068).
 *
 * `POST /webhook` accepted every request. Anyone who knew a GitLab project id could start builds,
 * and for containers with a tag pattern even choose which existing tag gets deployed. Every source
 * now has its own secret, which GitLab sends as `X-Gitlab-Token` with each webhook of that source.
 * Knowing the secret of one source does not allow to trigger the containers of another one.
 *
 * NSC__WEBHOOK_TOKEN_MODE switches the check per instance, so that existing hooks can get the secret
 * before requests without it are refused:
 *
 * - `off` (default): no check, as before.
 * - `report`: every request is still accepted; one without the right secret is logged.
 * - `enforce`: a container is only built for a request with the secret of its source.
 */
export type WebhookTokenMode = 'enforce' | 'off' | 'report';

export function resolveWebhookTokenMode(value: unknown): WebhookTokenMode {
  const mode = String(value ?? '').trim().toLowerCase();
  return mode === 'enforce' || mode === 'report' ? mode : 'off';
}

/** A new secret for a source: 32 random bytes, hex. */
export function generateWebhookSecret(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Whether `given` is the secret `expected`. Compares SHA-256 digests in constant time, so neither the
 * content nor the length of the secret leaks through the response time. A missing secret on either
 * side never matches.
 */
export function isValidWebhookToken(expected: string | null | undefined, given: string | string[] | null | undefined): boolean {
  const token = Array.isArray(given) ? given[0] : given;
  if (!expected || !token) {
    return false;
  }

  const a = createHash('sha256').update(expected).digest();
  const b = createHash('sha256').update(token).digest();
  return timingSafeEqual(a, b);
}
