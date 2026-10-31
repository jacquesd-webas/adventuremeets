import {
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { User } from "../auth/decorators/user.decorator";
import { UserProfile } from "../users/dto/user-profile.dto";
import { OrganizationWhatsappService } from "./organization-whatsapp.service";

@Controller(["organizations/:id/whatsapp", "organisations/:id/whatsapp"])
export class OrganizationWhatsappController {
  constructor(
    private readonly auth: AuthService,
    private readonly whatsapp: OrganizationWhatsappService,
  ) {}

  private assertAdmin(organizationId: string, user?: UserProfile) {
    if (!user) throw new UnauthorizedException();
    if (!this.auth.hasRole(user, organizationId, "admin")) {
      throw new ForbiddenException("Organization admin access required");
    }
  }

  @Get()
  async get(@Param("id") id: string, @User() user?: UserProfile) {
    this.assertAdmin(id, user);
    return this.whatsapp.getConnection(id);
  }

  @Post()
  async connect(@Param("id") id: string, @User() user?: UserProfile) {
    this.assertAdmin(id, user);
    return this.whatsapp.connect(id);
  }

  @Delete()
  async disconnect(@Param("id") id: string, @User() user?: UserProfile) {
    this.assertAdmin(id, user);
    return this.whatsapp.disconnect(id);
  }
}
