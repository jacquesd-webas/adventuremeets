export type ReportType = "attendees" | "meets";

export type ReportFilters = {
  organizationId: string;
  type: ReportType;
  search: string;
  status: string;
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
};

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
