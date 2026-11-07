import { generateWebhookSecret, isValidWebhookToken, resolveWebhookTokenMode } from './webhook-token.helper';

/** DEV-4068: the webhook only builds for requests that carry the secret of the container's source. */
describe('webhook token', () => {
  it('is off unless the instance sets report or enforce', () => {
    expect(resolveWebhookTokenMode(undefined)).toBe('off');
    expect(resolveWebhookTokenMode('')).toBe('off');
    expect(resolveWebhookTokenMode('true')).toBe('off');
    expect(resolveWebhookTokenMode('report')).toBe('report');
    expect(resolveWebhookTokenMode(' ENFORCE ')).toBe('enforce');
  });

  it('generates distinct 64-character hex secrets', () => {
    const a = generateWebhookSecret();
    const b = generateWebhookSecret();

    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(b).not.toBe(a);
  });

  it('accepts only the exact secret', () => {
    const secret = generateWebhookSecret();

    expect(isValidWebhookToken(secret, secret)).toBe(true);
    expect(isValidWebhookToken(secret, [secret])).toBe(true);
    expect(isValidWebhookToken(secret, `${secret} `)).toBe(false);
    expect(isValidWebhookToken(secret, secret.slice(0, 63))).toBe(false);
    expect(isValidWebhookToken(secret, 'x')).toBe(false);
  });

  it('never matches when a secret is missing on either side', () => {
    expect(isValidWebhookToken(undefined, undefined)).toBe(false);
    expect(isValidWebhookToken('', '')).toBe(false);
    expect(isValidWebhookToken(null, 'x')).toBe(false);
    expect(isValidWebhookToken('x', undefined)).toBe(false);
  });
});
