import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CalendarPage from "../CalendarPage";
import MeetStatusEnum from "../../types/MeetStatusEnum";

const mockMeet = {
  id: "meet-1",
  name: "Sunrise Hike",
  organizerId: "organizer-1",
  statusId: MeetStatusEnum.Closed,
  checkinCompleted: false,
  startTime: "2026-10-22T08:00:00.000Z",
  endTime: "2026-10-22T10:00:00.000Z",
};
let currentUserId = "organizer-1";

vi.mock("../../hooks/useFetchMeets", () => ({
  useFetchMeets: () => ({ data: [mockMeet], isLoading: false }),
}));

vi.mock("../../context/organizationContext", () => ({
  useCurrentOrganization: () => ({ currentOrganizationId: "org-1" }),
}));

vi.mock("../../context/authContext", () => ({
  useAuth: () => ({ user: { id: currentUserId } }),
}));

vi.mock("../../components/meet/MeetInfoModal", () => ({
  MeetInfoModal: ({ open }: { open: boolean }) =>
    open ? <div>Meet wall modal</div> : null,
}));

vi.mock("../../components/meet/MeetStatus", () => ({
  MeetStatus: () => null,
}));

vi.mock("../../components/meet/CalendarStatusFilter", () => ({
  CalendarStatusFilter: () => null,
}));

function renderCalendar(isMobile: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation(() => ({
      matches: isMobile,
      media: "",
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );

  render(
    <MemoryRouter initialEntries={["/calendar"]}>
      <Routes>
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/meet/:id/checkin" element={<div>Check-in page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CalendarPage meet selection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-21T08:00:00.000Z"));
    currentUserId = "organizer-1";
    mockMeet.checkinCompleted = false;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it.each([false, true])(
    "opens check-in for the organiser of a closed upcoming meet (mobile: %s)",
    (isMobile) => {
      renderCalendar(isMobile);

      fireEvent.click(screen.getByText("Sunrise Hike"));

      expect(screen.getByText("Check-in page")).toBeInTheDocument();
    },
  );

  it("opens the wall after check-in was completed", () => {
    mockMeet.checkinCompleted = true;
    renderCalendar(true);

    fireEvent.click(screen.getByText("Sunrise Hike"));

    expect(screen.getByText("Meet wall modal")).toBeInTheDocument();
  });

  it("opens the wall for someone other than the organiser", () => {
    currentUserId = "other-user";
    renderCalendar(true);

    fireEvent.click(screen.getByText("Sunrise Hike"));

    expect(screen.getByText("Meet wall modal")).toBeInTheDocument();
  });
});
