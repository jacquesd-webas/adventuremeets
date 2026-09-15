import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from "class-validator";

export class ReportQueryDto {
  @IsUUID()
  organizationId!: string;

  @IsIn(["attendees", "meets"])
  type!: "attendees" | "meets";

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 25;
}

export type ReportRow = {
  id: string;
  meetName: string;
  startTime: string | null;
  status: string;
  attendeeName?: string;
  email?: string;
  organizerName?: string;
  applied?: number;
  attended?: number;
};

export type ReportResponse = { rows: ReportRow[]; total: number };
