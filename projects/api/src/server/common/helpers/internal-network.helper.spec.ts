import { isInternalNetworkAddress } from './internal-network.helper';

describe('isInternalNetworkAddress', () => {
  it.each([
    '127.0.0.1',
    '::1',
    '::ffff:127.0.0.1',
    '172.16.0.1',
    '172.18.0.1',
    '::ffff:172.18.0.1',
    '172.31.255.254',
  ])('accepts the internal address %s', (ip) => {
    expect(isInternalNetworkAddress(ip)).toBe(true);
  });

  it.each([
    '10.0.1.25',
    '10.0.0.2',
    '192.168.10.3',
    '172.15.255.255',
    '172.32.0.1',
    '172.217.16.142',
    '::ffff:172.217.16.142',
    '8.8.8.8',
    '85.10.206.41',
    '2a01:4f8::1',
    '',
    undefined,
    null,
    'localhost',
    '127.0.0.1, 8.8.8.8',
  ])('rejects %s', (ip) => {
    expect(isInternalNetworkAddress(ip as string)).toBe(false);
  });
});
