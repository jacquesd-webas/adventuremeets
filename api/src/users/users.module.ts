import { Module, forwardRef } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { DatabaseModule } from "../database/database.module";
import { AuthModule } from "../auth/auth.module";
import { ObjectStorageService } from "../storage/object-storage.service";
import { AuditLogModule } from "../audit/audit-log.module";

@Module({
  imports: [DatabaseModule, forwardRef(() => AuthModule), AuditLogModule],
  controllers: [UsersController],
  providers: [UsersService, ObjectStorageService],
  exports: [UsersService],
})
export class UsersModule {}
