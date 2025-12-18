import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateMeetStatusDto {
  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  statusId!: number;
}
