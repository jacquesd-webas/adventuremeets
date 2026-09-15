import { Module } from "@nestjs/common";
import { MeetsModule } from "../meets/meets.module";
import { AuthModule } from "../auth/auth.module";
import { EmailModule } from "../email/email.module";
import { UsersModule } from "../users/users.module";
import { AuditLogModule } from "../audit/audit-log.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { AttendeesController } from "./attendees.controller";

@Module({
  imports: [MeetsModule, AuthModule, EmailModule, UsersModule, AuditLogModule, OrganizationsModule],
  controllers: [AttendeesController],
})
export class AttendeesModule {}
