import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { User } from "../auth/decorators/user.decorator";
import { UserProfile } from "../users/dto/user-profile.dto";
import { MeetsService } from "./meets.service";
import { MeetWhatsappService } from "./meet-whatsapp.service";
import { SendMeetWhatsappDto } from "./dto/send-meet-whatsapp.dto";

@Controller("meets/:id/whatsapp")
export class MeetWhatsappController {
  constructor(
    private readonly auth: AuthService,
    private readonly meets: MeetsService,
    private readonly whatsapp: MeetWhatsappService,
  ) {}

  private async authorizedMeet(id: string, user?: UserProfile) {
    if (!user) throw new UnauthorizedException();
    const meet = await this.meets.findOne(id);
    if (
      meet.organizerId !== user.id &&
      !this.auth.hasRole(user, meet.organizationId!, "admin")
    ) {
      throw new ForbiddenException(
        "Only the meet organiser or an organisation admin can send WhatsApp messages",
      );
    }
    return meet;
  }

  @Get("chats")
  async chats(@Param("id") id: string, @User() user?: UserProfile) {
    return this.whatsapp.listChats(await this.authorizedMeet(id, user));
  }

  @Post("send")
  async send(
    @Param("id") id: string,
    @Body() body: SendMeetWhatsappDto,
    @User() user?: UserProfile,
  ) {
    return this.whatsapp.send(await this.authorizedMeet(id, user), body);
  }
}
