import { EmailMessagesRepository } from "./email-messages.repository";
import { Module } from "@nestjs/common";
import { EmailService } from "./email.service";
import { EmailTrackingController } from "./email-tracking.controller";
import { DatabaseModule } from "../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [EmailTrackingController],
  providers: [EmailService, EmailMessagesRepository],
  exports: [EmailService],
})
export class EmailModule {}
