import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

const ALLOWED_IPS = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];

@Injectable()
export class LocalhostGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.connection?.remoteAddress;
    if (!ALLOWED_IPS.includes(ip)) {
      throw new ForbiddenException('Only localhost access is allowed');
    }
    return true;
  }
}
