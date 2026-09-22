import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class InviteLinkDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  token!: string;

  @ApiProperty()
  roleId!: number;

  @ApiPropertyOptional()
  roleName?: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  expiresAt!: string;

  @ApiPropertyOptional({ nullable: true })
  acceptedAt?: string | null;

  @ApiPropertyOptional({ nullable: true })
  declinedAt?: string | null;

  @ApiPropertyOptional()
  createdBy?: string;

  @ApiPropertyOptional()
  inviteUrl?: string;
}
