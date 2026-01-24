import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { UserProfile } from '../../users/dto/user-profile.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret',
    });
  }

  async validate(payload: any): Promise<UserProfile | null> {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      return null;
    }
    const organizationIds = await this.usersService.findOrganizationIds(
      user.id
    );
    const orgRoles = await this.usersService.findOrganizationRoles(user.id);
    const organizations = organizationIds.reduce<Record<string, string>>(
      (acc, orgId) => {
        const role =
          orgRoles.find((row) => row.organizationId === orgId)?.role ||
          "member";
        acc[orgId] = role;
        return acc;
      },
      {}
    );
    return {
      ...user,
      organizations,
      organizationId: organizationIds[0] ?? null,
    } as UserProfile;
  }
}
