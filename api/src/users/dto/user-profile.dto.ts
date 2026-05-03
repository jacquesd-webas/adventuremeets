import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsDateString, IsString } from "class-validator";

export class PendingInviteProfileDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsString()
  organizationId!: string;

  @ApiProperty()
  @IsString()
  organizationName!: string;

  @ApiProperty()
  roleId!: number;

  @ApiPropertyOptional()
  @IsString()
  roleName?: string;

  @ApiProperty()
  @IsDateString()
  createdAt!: string;

  @ApiProperty()
  @IsDateString()
  expiresAt!: string;
}

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
  avatarUrl?: string;

  @ApiPropertyOptional({
    type: "object",
    additionalProperties: { type: "string" },
  })
  organizations?: Record<string, string>;

  @ApiPropertyOptional({ type: [PendingInviteProfileDto] })
  pendingInvites?: PendingInviteProfileDto[];

  constructor() {
    this.organizations = {};
    this.pendingInvites = [];
  }

  // Internal use only; not exposed in /me response.
  passwordHash?: string;
}
