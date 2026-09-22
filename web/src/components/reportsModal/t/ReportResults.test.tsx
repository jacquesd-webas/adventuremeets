import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReportResults } from "../ReportResults";
import { useReportQuery } from "../../../hooks/useReportQuery";

vi.mock("../../../hooks/useReportQuery", () => ({ useReportQuery: vi.fn() }));
const mockQuery = vi.mocked(useReportQuery);

describe("ReportResults", () => {
  beforeEach(() => {
    mockQuery.mockReturnValue({ data: { rows: [], total: 0 }, isFetching: false, isError: false } as unknown as ReturnType<typeof useReportQuery>);
  });

  it("sends search and inclusive date filters to the query", () => {
    render(<ReportResults organizationId="org" type="attendees" />);
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "Alice" } });
    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-09-01" } });
    fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-09-15" } });
    expect(mockQuery).toHaveBeenLastCalledWith(expect.objectContaining({ organizationId: "org", type: "attendees", search: "Alice", startDate: "2026-09-01", endDate: "2026-09-15", page: 1 }), true);
  });

  it("prevents fetching reversed date ranges and clears filters", () => {
    render(<ReportResults organizationId="org" type="meets" />);
    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-09-15" } });
    fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-09-01" } });
    expect(screen.getByText("The end date must be on or after the start date.")).toBeInTheDocument();
    expect(mockQuery).toHaveBeenLastCalledWith(expect.anything(), false);
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(mockQuery).toHaveBeenLastCalledWith(expect.objectContaining({ startDate: "", endDate: "", page: 1 }), true);
  });
});
