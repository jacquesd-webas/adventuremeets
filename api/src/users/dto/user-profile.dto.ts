import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsDateString, IsString } from "class-validator";

export class UserProfile {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  @IsString()
  email!: string;

  @ApiPropertyOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @ApiPropertyOptional()
  @IsDateString()
  emailVerifiedAt?: string;

  @ApiPropertyOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  icePhone?: string;

  @ApiPropertyOptional()
  @IsString()
  iceName?: string;

  @ApiPropertyOptional()
  @IsString()
  iceMedicalAid?: string;

  @ApiPropertyOptional()
  @IsString()
  iceMedicalAidNumber?: string;

  @ApiPropertyOptional()
  @IsDateString()
  iceDob?: string;

  @ApiPropertyOptional({
    type: "object",
    additionalProperties: { type: "string" },
  })
  organizations?: Record<string, string>;

  constructor() {
    this.organizations = {};
  }

  // Internal use only; not exposed in /me response.
  passwordHash?: string;
}
