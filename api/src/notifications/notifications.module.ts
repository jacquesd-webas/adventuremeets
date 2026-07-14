import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { EmailModule } from "../email/email.module";
import { MeetsModule } from "../meets/meets.module";
import { NotificationsController } from "./notifications.controller";
import { WorkerApiKeyGuard } from "./guards/worker-api-key.guard";
import { NotificationsService } from "./notifications.service";

@Module({
  imports: [DatabaseModule, EmailModule, MeetsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, WorkerApiKeyGuard],
})
export class NotificationsModule {}
