import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class OrganizationMinimalDto {
  @ApiPropertyOptional()
  theme?: string;

  @ApiPropertyOptional()
  isPrivate?: boolean;
}
