import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { isInternalNetworkAddress } from '../helpers/internal-network.helper';

/**
 * Lets only loopback and private Docker networks through. Used by the internal migration server.
 */
@Injectable()
export class LocalhostGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.connection?.remoteAddress;
    if (!isInternalNetworkAddress(ip)) {
      throw new ForbiddenException('Only localhost access is allowed');
    }
    return true;
  }
}
