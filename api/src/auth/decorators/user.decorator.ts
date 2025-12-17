import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserProfile } from '../../users/dto/user-profile.dto';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserProfile | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as UserProfile | undefined;
  },
);
