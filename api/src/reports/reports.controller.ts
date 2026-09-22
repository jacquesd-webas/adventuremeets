import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { User } from "../auth/decorators/user.decorator";
import { UserProfile } from "../users/dto/user-profile.dto";
import { ReportQueryDto, ReportResponse } from "./dto/report-query.dto";
import { ReportsService } from "./reports.service";

@ApiTags("Reports")
@Controller("reports")
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  findReport(@Query() query: ReportQueryDto, @User() user?: UserProfile): Promise<ReportResponse> {
    return this.reports.findReport(query, user);
  }
}
