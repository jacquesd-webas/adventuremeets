import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class OrganizationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional()
  userCount?: number;

  @ApiPropertyOptional()
  templateCount?: number;

  @ApiPropertyOptional()
  canViewAllMeets?: boolean;

  @ApiPropertyOptional()
  theme?: string;

  @ApiPropertyOptional()
  isPrivate?: boolean;

  @ApiPropertyOptional()
  logoUrl?: string;

  @ApiPropertyOptional()
  customField1Name?: string;

  @ApiPropertyOptional()
  customField2Name?: string;

  @ApiPropertyOptional()
  meetCountLast30Days?: number;

  @ApiPropertyOptional()
  attendanceCountLast30Days?: number;

  @ApiPropertyOptional()
  meetCountLast90Days?: number;

  @ApiPropertyOptional()
  attendanceCountLast90Days?: number;

  @ApiPropertyOptional()
  meetCountTotal?: number;

  @ApiPropertyOptional()
  attendanceCountTotal?: number;

  @ApiPropertyOptional()
  adminCount?: number;

  @ApiPropertyOptional()
  organizerCount?: number;

  @ApiPropertyOptional()
  memberCount?: number;

  @ApiPropertyOptional()
  meetImageBytes?: number;

  @ApiPropertyOptional()
  wallImageBytes?: number;

  @ApiPropertyOptional()
  totalImageBytes?: number;
}
