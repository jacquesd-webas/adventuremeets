import { Module } from "@nestjs/common";
import { MeetsService } from "./meets.service";
import { MeetsController } from "./meets.controller";
import { MeetAttendeesController } from "./meet-attendees.controller";
import { DatabaseModule } from "../database/database.module";
import { MinioService } from "../storage/minio.service";
import { IncomingMailController } from "./incoming-mail.controller";
import { EmailModule } from "../email/email.module";
import { AuthModule } from "../auth/auth.module";
import { MeetShareController } from "./meet-share.controller";
import { MeetWallController } from "./meet-wall.controller";
import { UsersModule } from "../users/users.module";
import { OrganizationsModule } from "../organizations/organizations.module";

@Module({
  imports: [
    DatabaseModule,
    EmailModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
  ],
  controllers: [
    MeetsController,
    MeetAttendeesController,
    IncomingMailController,
    MeetShareController,
    MeetWallController,
  ],
  providers: [MeetsService, MinioService],
  exports: [MeetsService],
})
export class MeetsModule {}
