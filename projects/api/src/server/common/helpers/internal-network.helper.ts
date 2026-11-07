import { BlockList, isIPv4, isIPv6 } from 'net';

/**
 * Addresses the internal migration server (port 9090) accepts. Its only caller is TurboOps, which
 * runs `curl http://127.0.0.1:9090` on the host over SSH. That request reaches the container from
 * loopback or from the gateway of a Docker bridge network (docker0, docker_gwbridge), and Docker
 * takes those from 172.16.0.0/12.
 *
 * Deliberately not accepted:
 * - 10.0.0.0/8: Swarm overlay networks. The API shares `traefik-public` with every deployed
 *   container, so an overlay address can be any workload on the instance.
 * - 192.168.0.0/16 and public addresses: with the port published in host mode, clients on the
 *   host's network arrive with their real address.
 *
 * Before, every address starting with `172.` or `10.` passed, public 172.x ranges and the overlay
 * networks included.
 */
const INTERNAL_NETWORKS = new BlockList();
INTERNAL_NETWORKS.addSubnet('127.0.0.0', 8, 'ipv4');
INTERNAL_NETWORKS.addSubnet('172.16.0.0', 12, 'ipv4');
INTERNAL_NETWORKS.addAddress('::1', 'ipv6');

/**
 * Whether a request address belongs to loopback or a Docker bridge network. IPv4-mapped IPv6
 * addresses (`::ffff:172.18.0.1`) count as their IPv4 address. Anything unparseable is rejected.
 */
export function isInternalNetworkAddress(ip: string | undefined | null): boolean {
  if (!ip) {
    return false;
  }
  const address = ip.trim().replace(/^::ffff:/i, '');
  if (isIPv4(address)) {
    return INTERNAL_NETWORKS.check(address, 'ipv4');
  }
  if (isIPv6(address)) {
    return INTERNAL_NETWORKS.check(address, 'ipv6');
  }
  return false;
}
