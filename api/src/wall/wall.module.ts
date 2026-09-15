import { Module } from "@nestjs/common";
import { MeetsModule } from "../meets/meets.module";
import { AuthModule } from "../auth/auth.module";
import { AuditLogModule } from "../audit/audit-log.module";
import { WallController } from "./wall.controller";

@Module({
  imports: [MeetsModule, AuthModule, AuditLogModule],
  controllers: [WallController],
})
export class WallModule {}
