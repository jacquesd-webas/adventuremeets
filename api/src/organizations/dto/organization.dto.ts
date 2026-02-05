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
}
