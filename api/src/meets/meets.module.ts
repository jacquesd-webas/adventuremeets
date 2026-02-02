import { Module } from '@nestjs/common';
import { MeetsService } from './meets.service';
import { MeetsController } from './meets.controller';
import { MeetAttendeesController } from './meet-attendees.controller';
import { DatabaseModule } from '../database/database.module';
import { MinioService } from '../storage/minio.service';
import { IncomingMailController } from './incoming-mail.controller';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [DatabaseModule, EmailModule],
  controllers: [MeetsController, MeetAttendeesController, IncomingMailController],
  providers: [MeetsService, MinioService],
  exports: [MeetsService],
})
export class MeetsModule {}
