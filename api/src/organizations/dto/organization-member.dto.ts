import { ApiProperty } from "@nestjs/swagger";

export class OrganizationMemberDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  firstName?: string;

  @ApiProperty({ required: false })
  lastName?: string;

  @ApiProperty()
  role!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ required: false })
  createdAt?: string;

  @ApiProperty({ required: false })
  updatedAt?: string;
}
