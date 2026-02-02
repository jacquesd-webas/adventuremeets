import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class UserMetaValueDto {
  @ApiProperty()
  @IsString()
  key!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  value?: string | null;
}

export class UserMetaValuesPayloadDto {
  @ApiProperty()
  @IsString()
  organizationId!: string;

  @ApiProperty({ type: [UserMetaValueDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserMetaValueDto)
  values!: UserMetaValueDto[];
}
