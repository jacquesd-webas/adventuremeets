import { PartialType } from "@nestjs/mapped-types";
import { UserIceInfoDto } from "./user-ice-info.dto";

export class UpdateUserIceInfoDto extends PartialType(UserIceInfoDto) {}
