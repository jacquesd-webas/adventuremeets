import { Module } from "@nestjs/common";
import { TypesController } from "./types.controller";
import { MeetsModule } from "../meets/meets.module";

@Module({
  imports: [MeetsModule],
  controllers: [TypesController],
})
export class TypesModule {}
