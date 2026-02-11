import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request?.headers?.authorization;
    if (!authHeader) {
      return true;
    }
    return super.canActivate(context);
  }

  // Do not throw if auth fails; just return null user for public routes
  handleRequest(err: any, user: any) {
    if (err) {
      return null;
    }
    return user || null;
  }
}
