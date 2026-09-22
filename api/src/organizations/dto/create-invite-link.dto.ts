import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEmail, IsInt, IsOptional, Min } from "class-validator";

export class CreateInviteLinkDto {
  @ApiProperty({ description: "Email address of the invitee" })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({
    description: "Role id to assign when invite is accepted",
    default: 4,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  roleId?: number;

  @ApiPropertyOptional({
    description: "Expiry timestamp for this invite (ISO string)",
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
