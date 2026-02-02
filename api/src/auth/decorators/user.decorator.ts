import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserProfile } from '../../users/dto/user-profile.dto';

type UserWithOrganization = UserProfile & { organizationId?: string | null };

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserWithOrganization | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserProfile | undefined;
    if (!user) {
      return undefined;
    }
    const orgMap =
      request.organizations ?? (user as UserWithOrganization).organizations ?? undefined;
    const organizationIds = orgMap ? Object.keys(orgMap) : undefined;
    const organizationId =
      request.organizationId ??
      (user as UserWithOrganization).organizationId ??
      organizationIds?.[0] ??
      null;
    return {
      ...user,
      organizations: orgMap ?? user.organizations,
      organizationId,
    };
  },
);
