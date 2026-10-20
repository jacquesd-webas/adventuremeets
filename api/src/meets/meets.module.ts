import { Module } from "@nestjs/common";
import { MeetsService } from "./meets.service";
import { MeetsController } from "./meets.controller";
import { DatabaseModule } from "../database/database.module";
import { MinioService } from "../storage/minio.service";
import { IncomingMailController } from "./incoming-mail.controller";
import { EmailModule } from "../email/email.module";
import { AuthModule } from "../auth/auth.module";
import { MeetShareController } from "./meet-share.controller";
import { UsersModule } from "../users/users.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { AuditLogModule } from "../audit/audit-log.module";
import { AttendeeItemsStorageService } from "../storage/attendee-items-storage.service";
import { IndemnityTemplateController } from "./indemnity-template.controller";
import { IndemnityTemplateService } from "./indemnity-template.service";

@Module({
  imports: [
    DatabaseModule,
    EmailModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    AuditLogModule,
  ],
  controllers: [
    MeetsController,
    IncomingMailController,
    MeetShareController,
    IndemnityTemplateController,
  ],
  providers: [
    MeetsService,
    MinioService,
    AttendeeItemsStorageService,
    IndemnityTemplateService,
  ],
  exports: [MeetsService, IndemnityTemplateService],
})
export class MeetsModule {}
