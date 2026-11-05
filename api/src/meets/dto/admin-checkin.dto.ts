import { IsString, IsUUID, Matches } from "class-validator";

export class AdminCheckinDto {
  @IsUUID()
  attendeeId!: string;

  @IsString()
  @Matches(/^[a-f0-9]{48}$/)
  adminShareCode!: string;
}
