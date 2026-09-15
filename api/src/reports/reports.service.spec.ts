import { BadRequestException, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { ReportsService } from "./reports.service";
import { ReportsRepository } from "./reports.repository";
import { AuthService } from "../auth/auth.service";
import { UserProfile } from "../users/dto/user-profile.dto";
import { ReportQueryDto } from "./dto/report-query.dto";

describe("ReportsService", () => {
  const user = { id: "admin" } as UserProfile;
  const query = Object.assign(new ReportQueryDto(), { organizationId: "org", type: "meets" });
  const repository = { reportingEnabled: jest.fn(), findReport: jest.fn() };
  const auth = { hasRole: jest.fn() };
  const service = new ReportsService(repository as unknown as ReportsRepository, auth as unknown as AuthService);

  beforeEach(() => {
    jest.resetAllMocks();
    auth.hasRole.mockReturnValue(true);
    repository.reportingEnabled.mockResolvedValue(true);
    repository.findReport.mockResolvedValue({ rows: [], total: 0 });
  });

  it("rejects unauthenticated requests before reading data", async () => {
    await expect(service.findReport(query)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(repository.findReport).not.toHaveBeenCalled();
  });

  it("checks admin access for the requested organisation", async () => {
    auth.hasRole.mockReturnValue(false);
    await expect(service.findReport(query, user)).rejects.toBeInstanceOf(ForbiddenException);
    expect(auth.hasRole).toHaveBeenCalledWith(user, "org", "admin");
    expect(repository.reportingEnabled).not.toHaveBeenCalled();
  });

  it("rejects organisations without reporting", async () => {
    repository.reportingEnabled.mockResolvedValue(false);
    await expect(service.findReport(query, user)).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.findReport).not.toHaveBeenCalled();
  });

  it.each([
    { startDate: "2026-02-30" },
    { startDate: "2026-09-20", endDate: "2026-09-01" },
    { status: "attended" },
  ])("rejects invalid filters %j", async (filters) => {
    await expect(service.findReport({ ...query, ...filters }, user)).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.findReport).not.toHaveBeenCalled();
  });

  it("accepts a single-day date range and passes all filters to the repository", async () => {
    const filters = { ...query, startDate: "2026-09-15", endDate: "2026-09-15", search: "hike", status: "Completed", page: 2 };
    await service.findReport(filters, user);
    expect(repository.findReport).toHaveBeenCalledWith(filters);
  });

  it("validates report type, organisation ID and pagination", async () => {
    const dto = plainToInstance(ReportQueryDto, { organizationId: "bad", type: "unknown", page: "0", limit: "101" });
    const errors = await validate(dto);
    expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining(["organizationId", "type", "page", "limit"]));
  });
});
