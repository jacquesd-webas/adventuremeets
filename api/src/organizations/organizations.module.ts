import { Module } from "@nestjs/common";
import { OrganizationsController } from "./organizations.controller";
import { OrganizationsService } from "./organizations.service";
import { DatabaseModule } from "../database/database.module";
import { AuthModule } from "../auth/auth.module";
import { EmailModule } from "../email/email.module";
import { AuditLogModule } from "../audit/audit-log.module";

@Module({
  imports: [DatabaseModule, AuthModule, EmailModule, AuditLogModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
