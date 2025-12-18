import { Module } from '@nestjs/common';
import { MeetsService } from './meets.service';
import { MeetsController } from './meets.controller';
import { MeetAttendeesController } from './meet-attendees.controller';
import { DatabaseModule } from '../database/database.module';
import { MinioService } from '../storage/minio.service';

@Module({
  imports: [DatabaseModule],
  controllers: [MeetsController, MeetAttendeesController],
  providers: [MeetsService, MinioService],
  exports: [MeetsService],
})
export class MeetsModule {}
