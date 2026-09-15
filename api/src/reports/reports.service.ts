import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { UserProfile } from "../users/dto/user-profile.dto";
import { ReportQueryDto, ReportResponse } from "./dto/report-query.dto";
import { ReportsRepository } from "./reports.repository";

@Injectable()
export class ReportsService {
  constructor(private readonly repository: ReportsRepository, private readonly auth: AuthService) {}

  async findReport(query: ReportQueryDto, user?: UserProfile): Promise<ReportResponse> {
    if (!user) throw new UnauthorizedException();
    if (!this.auth.hasRole(user, query.organizationId, "admin")) {
      throw new ForbiddenException("Only organisation admins can access reports");
    }
    const statuses = query.type === "attendees"
      ? ["pending", "invited", "confirmed", "rejected", "waitlisted", "checked-in", "no-show", "attended", "cancelled"]
      : ["Draft", "Published", "Open", "Closed", "Cancelled", "Postponed", "Completed"];
    if (query.status && !statuses.includes(query.status)) throw new BadRequestException("Invalid report status");
    for (const date of [query.startDate, query.endDate]) {
      if (date && (Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) {
        throw new BadRequestException("Invalid report date");
      }
    }
    if (query.startDate && query.endDate && query.startDate > query.endDate) {
      throw new BadRequestException("Start date must be before end date");
    }
    if (!await this.repository.reportingEnabled(query.organizationId)) {
      throw new ForbiddenException("Advanced reporting is not enabled for this organisation");
    }
    return this.repository.findReport(query);
  }
}
