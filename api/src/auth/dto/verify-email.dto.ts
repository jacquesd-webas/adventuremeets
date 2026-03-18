import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches } from "class-validator";

export class VerifyEmailDto {
  @ApiProperty({ description: "6 digit verification code" })
  @IsString()
  @Matches(/^\d{6}$/, { message: "Verification code must be 6 digits" })
  code!: string;
}
