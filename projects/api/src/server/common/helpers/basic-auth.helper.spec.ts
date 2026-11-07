import { compare } from 'bcrypt';
import { getBasicAuthUsersLabelValue } from './basic-auth.helper';

/**
 * DEV-4068: builds regenerate the compose file, so the basic-auth label must be stable for the same
 * password, and it must no longer be produced by a shell command built from user input.
 */
describe('basic auth label', () => {
  const unescape = (value: string) => value.replace(/\$\$/g, '$');

  it('produces a bcrypt hash Traefik accepts and that matches the password', async () => {
    const value = unescape(await getBasicAuthUsersLabelValue('65bd5578f193afcd52df520a', 'team', 's3cret!'));
    const [user, hashed] = value.split(/:(.*)/s);

    expect(user).toBe('team');
    expect(hashed).toMatch(/^\$2b\$10\$[./A-Za-z0-9]{53}$/);
    expect(await compare('s3cret!', hashed)).toBe(true);
    expect(await compare('wrong', hashed)).toBe(false);
  });

  it('is stable for the same container, user and password', async () => {
    const first = await getBasicAuthUsersLabelValue('c1', 'team', 'pw');
    const second = await getBasicAuthUsersLabelValue('c1', 'team', 'pw');

    expect(second).toBe(first);
  });

  it('changes with the password and differs between containers', async () => {
    const base = await getBasicAuthUsersLabelValue('c1', 'team', 'pw');

    expect(await getBasicAuthUsersLabelValue('c1', 'team', 'pw2')).not.toBe(base);
    expect(await getBasicAuthUsersLabelValue('c2', 'team', 'pw')).not.toBe(base);
  });

  it('escapes every dollar sign for docker-compose', async () => {
    const value = await getBasicAuthUsersLabelValue('c1', 'team', 'pw');

    expect(value).not.toMatch(/(^|[^$])\$([^$]|$)/);
    expect(value.match(/\$\$/g)).toHaveLength(3);
  });

  it('treats shell metacharacters as plain text', async () => {
    const password = '$(touch /tmp/pwned); `id` && echo';
    const value = unescape(await getBasicAuthUsersLabelValue('c1', 'a b;c', password));
    const hashed = value.slice('a b;c:'.length);

    expect(value.startsWith('a b;c:')).toBe(true);
    expect(await compare(password, hashed)).toBe(true);
  });
});
