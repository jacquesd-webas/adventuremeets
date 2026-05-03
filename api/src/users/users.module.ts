import { Module, forwardRef } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { DatabaseModule } from "../database/database.module";
import { AuthModule } from "../auth/auth.module";
import { MinioService } from "../storage/minio.service";

@Module({
  imports: [DatabaseModule, forwardRef(() => AuthModule)],
  controllers: [UsersController],
  providers: [UsersService, MinioService],
  exports: [UsersService]
})
export class UsersModule {}
