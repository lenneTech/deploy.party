import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

const ALLOWED_IPS = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];

/**
 * Checks if an IP is a Docker internal network address.
 * Docker bridge/overlay networks use 172.16.0.0/12 and 10.0.0.0/8 ranges.
 */
function isDockerInternalIp(ip: string): boolean {
  // Strip IPv6-mapped IPv4 prefix
  const cleanIp = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  return cleanIp.startsWith('172.') || cleanIp.startsWith('10.');
}

@Injectable()
export class LocalhostGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.connection?.remoteAddress;
    if (!ALLOWED_IPS.includes(ip) && !isDockerInternalIp(ip)) {
      throw new ForbiddenException('Only localhost access is allowed');
    }
    return true;
  }
}
