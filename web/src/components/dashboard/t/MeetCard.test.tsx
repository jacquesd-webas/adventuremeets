import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MeetCard } from "../MeetCard";
import MeetStatusEnum from "../../../types/MeetStatusEnum";
import type Meet from "../../../types/MeetModel";

vi.mock("../../../context/authContext", () => ({
  useAuth: () => ({
    user: { id: "organizer-1" },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));

vi.mock("../../meet/MeetActionsMenu", () => ({
  MeetActionsMenu: () => <button type="button">Actions</button>,
}));

vi.mock("../../meet/MeetStatus", () => ({
  MeetStatus: () => <div>Status</div>,
}));

function makeMeet(overrides: Partial<Meet> = {}): Meet {
  return {
    id: "meet-1",
    name: "Mountain Hike",
    organizerId: "organizer-1",
    location: "Cape Town",
    startTime: "2026-07-18T08:00:00.000Z",
    endTime: "2026-07-18T10:00:00.000Z",
    statusId: MeetStatusEnum.Open,
    attendeeCount: 12,
    confirmedCount: 7,
    waitlistCount: 3,
    rejectedCount: 2,
    checkedInCount: 5,
    ...overrides,
  };
}

describe("MeetCard", () => {
  const baseProps = {
    statusLabel: "Open",
    setSelectedMeetId: vi.fn(),
    setPendingAction: vi.fn(),
    canViewMeet: true,
    canManageMeet: true,
    canAccessManageMenu: true,
  };

  it("shows applicants, approved, waitlist, and rejected counts for organizer upcoming meets", () => {
    render(
      <MemoryRouter>
        <MeetCard meet={makeMeet()} {...baseProps} />
      </MemoryRouter>,
    );

    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("applicants")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("approved")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("waitlist")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("rejected")).toBeInTheDocument();
  });

  it("shows applicants, attended ratio, waitlist, and rejected counts for organizer past meets", () => {
    render(
      <MemoryRouter>
        <MeetCard
          meet={makeMeet({
            statusId: MeetStatusEnum.Completed,
            startTime: "2026-07-16T08:00:00.000Z",
            endTime: "2026-07-16T10:00:00.000Z",
          })}
          {...baseProps}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("applicants")).toBeInTheDocument();
    expect(screen.getByText("5/7")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("waitlist")).toBeInTheDocument();
    expect(screen.getByText("rejected")).toBeInTheDocument();
    expect(screen.getByText("attended")).toBeInTheDocument();
    expect(screen.queryByText("approved")).not.toBeInTheDocument();
  });

  it("shows only applicants when there are no applicants yet", () => {
    render(
      <MemoryRouter>
        <MeetCard
          meet={makeMeet({
            attendeeCount: 0,
            confirmedCount: 0,
            waitlistCount: 0,
            rejectedCount: 0,
          })}
          {...baseProps}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("applicants")).toBeInTheDocument();
    expect(screen.queryByText("approved")).not.toBeInTheDocument();
    expect(screen.queryByText("waitlist")).not.toBeInTheDocument();
    expect(screen.queryByText("rejected")).not.toBeInTheDocument();
    expect(screen.queryByText("attended")).not.toBeInTheDocument();
  });
});
