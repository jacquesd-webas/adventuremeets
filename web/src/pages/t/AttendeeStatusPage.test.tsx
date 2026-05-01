import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AttendeeStatusPage from "../AttendeeStatusPage";
import { MeetStatusEnum } from "../../types/MeetStatusEnum";

vi.mock("../../hooks/useFetchMeetSignup", () => ({
  useFetchMeetSignup: vi.fn(),
}));

vi.mock("../../hooks/useFetchMeetAttendeeStatus", () => ({
  useFetchMeetAttendeeStatus: vi.fn(),
}));

vi.mock("../../hooks/useFetchOrganization", () => ({
  useFetchOrganization: vi.fn(() => ({ data: null })),
}));

vi.mock("../../context/ThemeModeContext", () => ({
  useThemeMode: () => ({ mode: "light" }),
}));

vi.mock("../../helpers/organizationTheme", () => ({
  getOrganizationBackground: () => ({ image: "", color: "#fff" }),
}));

vi.mock("../../components/meet/MeetInfoSummary", () => ({
  MeetInfoSummary: ({ meet }: { meet: { name: string } }) => <div>{meet.name}</div>,
}));

vi.mock("../../components/attendeeStatus/AttendeeStatusAlert", () => ({
  AttendeeStatusAlert: () => <div>status alert</div>,
}));

vi.mock("../../components/attendeeStatus/AttendeeRsvp", () => ({
  AttendeeRsvp: () => <div>attendee rsvp</div>,
}));

vi.mock("../../components/wall/MeetWall", () => ({
  MeetWall: ({ meetId }: { meetId: string }) => <div>meet wall {meetId}</div>,
}));

vi.mock("../../components/meet/MeetNotFound", () => ({
  MeetNotFound: () => <div>not found</div>,
}));

vi.mock("../../components/FullPageSpinner", () => ({
  FullPageSpinner: () => <div>loading</div>,
}));

vi.mock("../../components/attendeeStatus/ContactOrganizerDialog", () => ({
  ContactOrganizerDialog: () => null,
}));

vi.mock("../../components/attendeeStatus/WithdrawApplicationDialog", () => ({
  WithdrawApplicationDialog: () => null,
}));

vi.mock("../../components/attendeeStatus/VerifyAttendeeEmailDialog", () => ({
  VerifyAttendeeEmailDialog: () => null,
}));

import { useFetchMeetSignup } from "../../hooks/useFetchMeetSignup";
import { useFetchMeetAttendeeStatus } from "../../hooks/useFetchMeetAttendeeStatus";

function renderPage() {
  return render(
    <MemoryRouter
      initialEntries={["/meets/share-1/attendee-1"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/meets/:code/:attendeeId" element={<AttendeeStatusPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AttendeeStatusPage", () => {
  beforeEach(() => {
    vi.mocked(useFetchMeetAttendeeStatus).mockReturnValue({
      data: { attendee: { id: "attendee-1", status: "confirmed" } },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it("shows the meet wall for completed meets", () => {
    vi.mocked(useFetchMeetSignup).mockReturnValue({
      data: {
        id: "meet-1",
        name: "Completed Meet",
        statusId: MeetStatusEnum.Completed,
        startTime: "2026-04-20T08:00:00.000Z",
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText("meet wall meet-1")).toBeInTheDocument();
  });

  it("shows the meet wall for closed meets after the start time", () => {
    vi.mocked(useFetchMeetSignup).mockReturnValue({
      data: {
        id: "meet-2",
        name: "Closed Meet",
        statusId: MeetStatusEnum.Closed,
        startTime: "2026-04-20T08:00:00.000Z",
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText("meet wall meet-2")).toBeInTheDocument();
  });

  it("does not show the meet wall for closed meets before the start time", () => {
    vi.mocked(useFetchMeetSignup).mockReturnValue({
      data: {
        id: "meet-3",
        name: "Upcoming Closed Meet",
        statusId: MeetStatusEnum.Closed,
        startTime: "2099-04-20T08:00:00.000Z",
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.queryByText("meet wall meet-3")).not.toBeInTheDocument();
  });
});
