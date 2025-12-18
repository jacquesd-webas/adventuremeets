import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    if (process.env.DEBUG_AUTH === 'true') {
      const request = context.switchToHttp().getRequest();
      if (!request?.headers?.authorization) {
        this.logger.warn('Missing Authorization header');
      }
    }
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info?: { message?: string }) {
    if (process.env.DEBUG_AUTH === 'true' && (err || !user)) {
      this.logger.warn(`Auth failed: ${info?.message || err?.message || 'no user'}`);
    }
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
