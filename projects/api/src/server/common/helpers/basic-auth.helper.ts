import { hash } from 'bcrypt';
import { createHash } from 'crypto';

/**
 * Value of a Traefik `basicauth.users` label, already escaped for docker-compose (DEV-4068).
 *
 * Until now every compose template ran `echo $(htpasswd -nb <user> <password>)` in a shell. That had
 * two problems:
 *
 * - The user name and the password went into a shell command unquoted, so a `;` or `$(…)` in either
 *   executed commands in the API container, which holds the Docker socket.
 * - htpasswd salts randomly, so the label changed on every generation. Since builds regenerate the
 *   compose file from the container settings, every build would have reported a changed file.
 *
 * The hash is now bcrypt (Traefik accepts `$2b$`), computed in-process. Its salt is derived from the
 * container and the user name: the same password gives the same label, a changed password a
 * different one, and two containers with the same credentials still get different hashes.
 */
export async function getBasicAuthUsersLabelValue(containerId: string, username: string, password: string): Promise<string> {
  const salt = `$2b$10$${bcryptBase64(deriveSalt(containerId, username))}`;
  const hashed = await hash(password, salt);

  // docker-compose reads `$` as variable interpolation; `$$` is a literal dollar sign.
  return `${username}:${hashed}`.replace(/\$/g, '$$$$');
}

function deriveSalt(containerId: string, username: string): Buffer {
  return createHash('sha256').update(`deploy.party basic auth\n${containerId}\n${username}`).digest().subarray(0, 16);
}

const BCRYPT_ALPHABET = './ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** The base64 variant bcrypt uses for its salt: 16 bytes become 22 characters. */
function bcryptBase64(bytes: Buffer): string {
  let out = '';
  let offset = 0;

  while (offset < bytes.length) {
    let c1 = bytes[offset++];
    out += BCRYPT_ALPHABET[(c1 >> 2) & 0x3f];
    c1 = (c1 & 0x03) << 4;
    if (offset >= bytes.length) {
      out += BCRYPT_ALPHABET[c1 & 0x3f];
      break;
    }

    let c2 = bytes[offset++];
    c1 |= (c2 >> 4) & 0x0f;
    out += BCRYPT_ALPHABET[c1 & 0x3f];
    c1 = (c2 & 0x0f) << 2;
    if (offset >= bytes.length) {
      out += BCRYPT_ALPHABET[c1 & 0x3f];
      break;
    }

    c2 = bytes[offset++];
    c1 |= (c2 >> 6) & 0x03;
    out += BCRYPT_ALPHABET[c1 & 0x3f];
    out += BCRYPT_ALPHABET[c2 & 0x3f];
  }

  return out;
}
