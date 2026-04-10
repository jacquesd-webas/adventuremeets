import { Module } from "@nestjs/common";
import { TypesController } from "./types.controller";
import { MeetsModule } from "../meets/meets.module";
import { DatabaseModule } from "../database/database.module";
import { TypesService } from "./types.service";

@Module({
  imports: [MeetsModule, DatabaseModule],
  controllers: [TypesController],
  providers: [TypesService],
})
export class TypesModule {}
