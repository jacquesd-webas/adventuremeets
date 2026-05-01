import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import MeetCheckinPage from "../MeetCheckinPage";

vi.mock("../../hooks/useFetchMeet", () => ({
  useFetchMeet: () => ({
    data: { organizerId: "organizer-1" },
  }),
}));

vi.mock("../../hooks/useFetchMeetAttendees", () => ({
  useFetchMeetAttendees: () => ({
    data: [],
    isLoading: false,
    isOfflineData: false,
    error: null,
  }),
}));

vi.mock("../../hooks/useCheckinAttendees", () => ({
  useCheckinAttendees: () => ({
    checkinAttendeesAsync: vi.fn(),
    queuedStatusByAttendeeId: {},
    failedStatusByAttendeeId: {},
    isOffline: false,
    pendingCount: 0,
    failedCount: 0,
  }),
}));

vi.mock("../../context/authContext", () => ({
  useAuth: () => ({
    user: { id: "organizer-1" },
  }),
}));

describe("MeetCheckinPage", () => {
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
});
