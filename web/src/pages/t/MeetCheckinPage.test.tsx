import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import MeetCheckinPage from "../MeetCheckinPage";
import AttendeeStatusEnum from "../../types/AttendeeStatusEnum";

let mockMeet = { organizerId: "organizer-1" };
let mockUser = { id: "organizer-1" };
let mockAttendees: Array<{
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
}> = [];
let mockCheckinState = {
  checkinAttendeesAsync: vi.fn(),
  queuedStatusByAttendeeId: {},
  failedStatusByAttendeeId: {},
  isOffline: false,
  pendingCount: 0,
  failedCount: 0,
};
const attendeeCheckinItemSpy = vi.fn();

vi.mock("../../hooks/useFetchMeet", () => ({
  useFetchMeet: () => ({
    data: mockMeet,
  }),
}));

vi.mock("../../hooks/useFetchMeetAttendees", () => ({
  useFetchMeetAttendees: () => ({
    data: mockAttendees,
    isLoading: false,
    isOfflineData: false,
    error: null,
  }),
}));

vi.mock("../../hooks/useCheckinAttendees", () => ({
  useCheckinAttendees: () => mockCheckinState,
}));

vi.mock("../../context/authContext", () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

vi.mock("../../components/attendeeCheckin/AttendeeCheckinItem", () => ({
  AttendeeCheckinItem: (props: any) => {
    attendeeCheckinItemSpy(props);
    return (
      <div>
        <button onClick={() => props.onCheckin(props.attendee.id)}>
          {props.attendee.name || props.attendee.id}
        </button>
        <button onClick={() => props.onUndo(props.attendee)}>
          undo {props.attendee.name || props.attendee.id}
        </button>
      </div>
    );
  },
}));

describe("MeetCheckinPage", () => {
  const setMobileMatchMedia = (matches: boolean) => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
  };

  beforeEach(() => {
    mockMeet = { organizerId: "organizer-1" };
    mockUser = { id: "organizer-1" };
    mockAttendees = [];
    mockCheckinState = {
      checkinAttendeesAsync: vi.fn().mockResolvedValue(undefined),
      queuedStatusByAttendeeId: {},
      failedStatusByAttendeeId: {},
      isOffline: false,
      pendingCount: 0,
      failedCount: 0,
    };
    attendeeCheckinItemSpy.mockClear();
    setMobileMatchMedia(false);
  });

  it("returns to the dashboard when closing in tests", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        initialEntries={["/meet/meet-1/checkin"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/meet/:id/checkin" element={<MeetCheckinPage />} />
          <Route path="/" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByLabelText("Close check-in"));

    expect(await screen.findByText("Dashboard")).toBeInTheDocument();
  });

  it("returns to the launching route when returnTo state is provided", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/meet/meet-1/checkin",
            state: { returnTo: "/plan" },
          },
        ]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/meet/:id/checkin" element={<MeetCheckinPage />} />
          <Route path="/plan" element={<div>List Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByLabelText("Close check-in"));

    expect(await screen.findByText("List Page")).toBeInTheDocument();
  });

  it("returns to the dashboard when finishing check-in", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        initialEntries={["/meet/meet-1/checkin"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/meet/:id/checkin" element={<MeetCheckinPage />} />
          <Route path="/" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Finish Check-In" }));

    expect(await screen.findByText("Dashboard")).toBeInTheDocument();
  });

  it("shows an unlock control for an org admin who did not organize the meet", async () => {
    mockMeet = {
      organizerId: "organizer-1",
      organizationId: "org-1",
    };
    mockUser = {
      id: "admin-1",
      organizations: { "org-1": "admin" },
    };

    render(
      <MemoryRouter
        initialEntries={["/meet/meet-1/checkin"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/meet/:id/checkin" element={<MeetCheckinPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("Unlock meet")).toBeInTheDocument();
  });

  it("keeps the attendee list in its own scroll container on mobile", () => {
    setMobileMatchMedia(true);

    render(
      <MemoryRouter
        initialEntries={["/meet/meet-1/checkin"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/meet/:id/checkin" element={<MeetCheckinPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("meet-checkin-layout")).toHaveStyle({
      flex: "1",
      minHeight: "0",
    });
    expect(screen.getByTestId("meet-checkin-scroll-container")).toHaveStyle({
      flex: "1",
      overflowY: "auto",
      minHeight: "0",
    });
  });

  it("does not set the row checking spinner while offline", async () => {
    const user = userEvent.setup();
    mockAttendees = [
      {
        id: "attendee-1",
        name: "Alex Example",
        status: AttendeeStatusEnum.Confirmed,
      },
    ];
    mockCheckinState = {
      checkinAttendeesAsync: vi.fn().mockResolvedValue(undefined),
      queuedStatusByAttendeeId: {
        "attendee-1": AttendeeStatusEnum.CheckedIn,
      },
      failedStatusByAttendeeId: {},
      isOffline: true,
      pendingCount: 1,
      failedCount: 0,
    };

    render(
      <MemoryRouter
        initialEntries={["/meet/meet-1/checkin"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/meet/:id/checkin" element={<MeetCheckinPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByRole("button", { name: "Alex Example" });

    expect(attendeeCheckinItemSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        attendee: expect.objectContaining({ id: "attendee-1" }),
        isCheckingIn: false,
        isChecked: true,
      }),
    );
    expect(mockCheckinState.checkinAttendeesAsync).not.toHaveBeenCalled();
  });

  it("optimistically marks an attendee checked immediately after an offline click", async () => {
    const user = userEvent.setup();
    mockAttendees = [
      {
        id: "attendee-1",
        name: "Alex Example",
        status: AttendeeStatusEnum.Confirmed,
      },
    ];
    mockCheckinState = {
      checkinAttendeesAsync: vi.fn().mockResolvedValue(undefined),
      queuedStatusByAttendeeId: {},
      failedStatusByAttendeeId: {},
      isOffline: true,
      pendingCount: 0,
      failedCount: 0,
    };

    render(
      <MemoryRouter
        initialEntries={["/meet/meet-1/checkin"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/meet/:id/checkin" element={<MeetCheckinPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Alex Example" }));

    expect(mockCheckinState.checkinAttendeesAsync).toHaveBeenCalledWith({
      meetId: "meet-1",
      attendeeIds: ["attendee-1"],
    });
    expect(attendeeCheckinItemSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        attendee: expect.objectContaining({ id: "attendee-1" }),
        isCheckingIn: false,
        isChecked: true,
      }),
    );
  });

  it("closes the undo dialog immediately while offline", async () => {
    const user = userEvent.setup();
    mockAttendees = [
      {
        id: "attendee-1",
        name: "Alex Example",
        status: AttendeeStatusEnum.Confirmed,
      },
    ];
    mockCheckinState = {
      checkinAttendeesAsync: vi.fn().mockImplementation(
        () => new Promise(() => undefined),
      ),
      queuedStatusByAttendeeId: {
        "attendee-1": AttendeeStatusEnum.CheckedIn,
      },
      failedStatusByAttendeeId: {},
      isOffline: true,
      pendingCount: 1,
      failedCount: 0,
    };

    render(
      <MemoryRouter
        initialEntries={["/meet/meet-1/checkin"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/meet/:id/checkin" element={<MeetCheckinPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "undo Alex Example" }));
    expect(screen.getByText("Undo check-in?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Undo check-in" }));

    await waitFor(() => {
      expect(
        screen.queryByText("Undo check-in?"),
      ).not.toBeInTheDocument();
    });
    expect(mockCheckinState.checkinAttendeesAsync).toHaveBeenCalledWith({
      meetId: "meet-1",
      attendeeIds: ["attendee-1"],
      status: "confirmed",
    });
  });
});
