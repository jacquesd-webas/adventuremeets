import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReportsModal } from "../ReportsModal";
import { useFetchMeet } from "../../../hooks/useFetchMeet";
import { useFetchMeetAttendees } from "../../../hooks/useFetchMeetAttendees";
import { useGenerateMeetReport } from "../../../hooks/useGenerateMeetReport";
import { useUpdateMeetStatus } from "../../../hooks/useUpdateMeetStatus";
import MeetStatusEnum from "../../../types/MeetStatusEnum";
import AttendeeStatusEnum from "../../../types/AttendeeStatusEnum";

vi.mock("../../../hooks/useFetchMeet", () => ({ useFetchMeet: vi.fn() }));
vi.mock("../../../hooks/useFetchMeetAttendees", () => ({
  useFetchMeetAttendees: vi.fn(),
}));
vi.mock("../../../hooks/useGenerateMeetReport", () => ({
  useGenerateMeetReport: vi.fn(),
}));
vi.mock("../../../hooks/useUpdateMeetStatus", () => ({
  useUpdateMeetStatus: vi.fn(),
}));

describe("ReportsModal", () => {
  const calls: string[] = [];

  beforeEach(() => {
    calls.length = 0;
    vi.mocked(useFetchMeet).mockReturnValue({
      data: {
        id: "meet-1",
        name: "Walk",
        organizerId: "organizer-1",
        statusId: MeetStatusEnum.Closed,
        startTime: "2020-01-01T10:00:00Z",
        checkinCompleted: false,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    vi.mocked(useFetchMeetAttendees).mockReturnValue({
      data: [
        {
          id: "attendee-1",
          name: "Alex",
          status: AttendeeStatusEnum.Confirmed,
        },
        { id: "attendee-2", name: "Sam", status: AttendeeStatusEnum.CheckedIn },
      ],
      isLoading: false,
      isOfflineData: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useFetchMeetAttendees>);
    vi.mocked(useUpdateMeetStatus).mockReturnValue({
      updateStatusAsync: vi.fn().mockImplementation(async () => {
        calls.push("complete meet");
      }),
    } as unknown as ReturnType<typeof useUpdateMeetStatus>);
    vi.mocked(useGenerateMeetReport).mockReturnValue({
      generateReportAsync: vi.fn().mockImplementation(async () => {
        calls.push("generate report");
        return null;
      }),
    } as unknown as ReturnType<typeof useGenerateMeetReport>);
  });

  it("keeps confirmed attendees confirmed until check-in is completed", async () => {
    const user = userEvent.setup();
    render(
      <ReportsModal open meetId="meet-1" onClose={vi.fn()} canManageMeet />,
    );

    expect(screen.getByText("Confirmed")).toBeInTheDocument();
    expect(screen.queryByText("No show")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Generate report" }));
    await waitFor(() =>
      expect(calls).toEqual(["complete meet", "generate report"]),
    );
  });

  it("shows no-shows after check-in is completed", () => {
    vi.mocked(useFetchMeet).mockReturnValue({
      data: {
        id: "meet-1",
        name: "Walk",
        organizerId: "organizer-1",
        statusId: MeetStatusEnum.Closed,
        checkinCompleted: true,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <ReportsModal open meetId="meet-1" onClose={vi.fn()} canManageMeet />,
    );

    expect(screen.getByText("No show")).toBeInTheDocument();
    expect(screen.queryByText("Confirmed")).not.toBeInTheDocument();
  });
});
