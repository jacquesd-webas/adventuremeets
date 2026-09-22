import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import MeetSelfCheckinPage from "../MeetSelfCheckinPage";

const checkAttendeeAsync = vi.fn();
const updateMeetAttendeeByCodeAsync = vi.fn();

let mockMeet: Record<string, any> | null = {
  id: "meet-1",
  name: "Mountain Hike",
  organizationId: "org-1",
  shareCode: "share-123",
  allowSelfCheckin: true,
  checkinPin: "PIN123",
  allowWalkins: false,
  requireEmail: true,
  requirePhone: false,
};

vi.mock("../../hooks/useFetchMeetSignup", () => ({
  useFetchMeetSignup: () => ({
    data: mockMeet,
    isLoading: false,
  }),
}));

vi.mock("../../hooks/useFetchOrganization", () => ({
  useFetchOrganization: () => ({
    data: { id: "org-1", theme: null },
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../context/ThemeModeContext", () => ({
  useThemeMode: () => ({
    mode: "light",
  }),
}));

vi.mock("../../helpers/organizationTheme", () => ({
  getOrganizationBackground: () => ({
    image: "",
    color: "rgb(255, 255, 255)",
  }),
}));

vi.mock("../../context/authContext", () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
  }),
}));

vi.mock("../../hooks/useCheckMeetAttendee", () => ({
  useCheckMeetAttendee: () => ({
    checkAttendeeAsync,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../hooks/useUpdateMeetAttendeeByCode", () => ({
  useUpdateMeetAttendeeByCode: () => ({
    updateMeetAttendeeByCodeAsync,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../components/meet/MeetNotFound", () => ({
  MeetNotFound: () => <div>Meet not found</div>,
}));

describe("MeetSelfCheckinPage", () => {
  beforeEach(() => {
    checkAttendeeAsync.mockReset();
    updateMeetAttendeeByCodeAsync.mockReset();
    mockMeet = {
      id: "meet-1",
      name: "Mountain Hike",
      organizationId: "org-1",
      shareCode: "share-123",
      allowSelfCheckin: true,
      checkinPin: "PIN123",
      allowWalkins: false,
      requireEmail: true,
      requirePhone: false,
    };
  });

  it("shows not found when the pin is invalid", () => {
    render(
      <MemoryRouter initialEntries={["/meets/share-123/checkin?pin=WRONG"]}>
        <Routes>
          <Route
            path="/meets/:code/checkin"
            element={<MeetSelfCheckinPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Meet not found")).toBeInTheDocument();
  });

  it("keeps the check-in button disabled until at least one field is filled in", () => {
    render(
      <MemoryRouter initialEntries={["/meets/share-123/checkin?pin=PIN123"]}>
        <Routes>
          <Route
            path="/meets/:code/checkin"
            element={<MeetSelfCheckinPage />}
          />
          <Route path="/meets/:code/:attendeeId" element={<div>Status page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "Check in" })).toBeDisabled();
  });

  it("matches an attendee and enables check-in", async () => {
    const user = userEvent.setup();
    checkAttendeeAsync.mockResolvedValue({
      attendee: { id: "attendee-1", name: "Alex Example", status: "confirmed" },
      attendees: [
        { id: "attendee-1", name: "Alex Example", status: "confirmed" },
      ],
    });
    updateMeetAttendeeByCodeAsync.mockResolvedValue({});

    render(
      <MemoryRouter initialEntries={["/meets/share-123/checkin?pin=PIN123"]}>
        <Routes>
          <Route
            path="/meets/:code/checkin"
            element={<MeetSelfCheckinPage />}
          />
          <Route path="/meets/:code/:attendeeId" element={<div>Status page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText("Your name"), "Alex Example");
    await user.type(
      screen.getByPlaceholderText("you@example.com"),
      "alex@example.com",
    );

    await waitFor(() => {
      expect(checkAttendeeAsync).toHaveBeenCalledWith({
        meetId: "meet-1",
        name: "Alex Example",
        email: "alex@example.com",
        phone: undefined,
      });
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Check in" })).toBeEnabled();
    });
    await user.click(screen.getByRole("button", { name: "Check in" }));

    expect(updateMeetAttendeeByCodeAsync).toHaveBeenCalledWith({
      meetCode: "share-123",
      attendeeId: "attendee-1",
      status: "checked-in",
    });
  });

  it("offers registration when no attendee matches and walk-ins are allowed", async () => {
    const user = userEvent.setup();
    mockMeet = {
      ...mockMeet,
      allowWalkins: true,
    };
    checkAttendeeAsync.mockResolvedValue({ attendee: null, attendees: [] });

    render(
      <MemoryRouter initialEntries={["/meets/share-123/checkin?pin=PIN123"]}>
        <Routes>
          <Route
            path="/meets/:code/checkin"
            element={<MeetSelfCheckinPage />}
          />
          <Route path="/meets/:code" element={<div>Meet signup</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText("Your name"), "Taylor Trail");
    await user.type(
      screen.getByPlaceholderText("you@example.com"),
      "taylor@example.com",
    );

    await waitFor(() => {
      expect(screen.getByText("No matches found yet")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Check in" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(await screen.findByText("Meet signup")).toBeInTheDocument();
  });

  it("matches by name only when email and phone are not required", async () => {
    const user = userEvent.setup();
    mockMeet = {
      ...mockMeet,
      requireEmail: false,
      requirePhone: false,
    };
    checkAttendeeAsync.mockResolvedValue({
      attendee: { id: "attendee-3", name: "Name Only", status: "confirmed" },
      attendees: [{ id: "attendee-3", name: "Name Only", status: "confirmed" }],
    });
    updateMeetAttendeeByCodeAsync.mockResolvedValue({});

    render(
      <MemoryRouter initialEntries={["/meets/share-123/checkin?pin=PIN123"]}>
        <Routes>
          <Route
            path="/meets/:code/checkin"
            element={<MeetSelfCheckinPage />}
          />
          <Route path="/meets/:code/:attendeeId" element={<div>Status page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText("Your name"), "Name Only");

    await waitFor(() => {
      expect(checkAttendeeAsync).toHaveBeenCalledWith({
        meetId: "meet-1",
        name: "Name Only",
        email: undefined,
        phone: undefined,
      });
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Check in" })).toBeEnabled();
    });
    await user.click(screen.getByRole("button", { name: "Check in" }));

    expect(updateMeetAttendeeByCodeAsync).toHaveBeenCalledWith({
      meetCode: "share-123",
      attendeeId: "attendee-3",
      status: "checked-in",
    });
  });

  it("treats matching checked-in attendees as already checked in", async () => {
    const user = userEvent.setup();
    mockMeet = {
      ...mockMeet,
      requireEmail: false,
      requirePhone: false,
    };
    checkAttendeeAsync.mockResolvedValue({
      attendee: { id: "attendee-4", name: "Checked In", status: "checked-in" },
      attendees: [
        { id: "attendee-4", name: "Checked In", status: "checked-in" },
        { id: "attendee-5", name: "Checked In", status: "attended" },
      ],
    });

    render(
      <MemoryRouter initialEntries={["/meets/share-123/checkin?pin=PIN123"]}>
        <Routes>
          <Route
            path="/meets/:code/checkin"
            element={<MeetSelfCheckinPage />}
          />
          <Route path="/meets/:code/:attendeeId" element={<div>Status page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText("Your name"), "Checked In");

    await waitFor(() => {
      expect(checkAttendeeAsync).toHaveBeenCalledWith({
        meetId: "meet-1",
        name: "Checked In",
        email: undefined,
        phone: undefined,
      });
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Check in" })).toBeEnabled();
    });
    await user.click(screen.getByRole("button", { name: "Check in" }));

    expect(await screen.findByText("Status page")).toBeInTheDocument();
    expect(updateMeetAttendeeByCodeAsync).not.toHaveBeenCalled();
  });

  it("asks which attendee to check in when multiple different matches are found", async () => {
    const user = userEvent.setup();
    checkAttendeeAsync.mockResolvedValue({
      attendee: { id: "attendee-6", name: "Alex Jr", status: "confirmed" },
      attendees: [
        {
          id: "attendee-6",
          name: "Alex Jr",
          email: "family@example.com",
          status: "confirmed",
        },
        {
          id: "attendee-7",
          name: "Alex Senior",
          email: "family@example.com",
          status: "confirmed",
        },
      ],
    });
    updateMeetAttendeeByCodeAsync.mockResolvedValue({});

    render(
      <MemoryRouter initialEntries={["/meets/share-123/checkin?pin=PIN123"]}>
        <Routes>
          <Route
            path="/meets/:code/checkin"
            element={<MeetSelfCheckinPage />}
          />
          <Route path="/meets/:code/:attendeeId" element={<div>Status page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText("Your name"), "Alex");
    await user.type(
      screen.getByPlaceholderText("you@example.com"),
      "family@example.com",
    );

    await waitFor(() => {
      expect(checkAttendeeAsync).toHaveBeenCalledWith({
        meetId: "meet-1",
        name: "Alex",
        email: "family@example.com",
        phone: undefined,
      });
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Check in" })).toBeEnabled();
    });
    await user.click(screen.getByRole("button", { name: "Check in" }));

    expect(
      await screen.findByText("Which attendee should we check in?"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Alex Senior/i }));

    expect(updateMeetAttendeeByCodeAsync).toHaveBeenCalledWith({
      meetCode: "share-123",
      attendeeId: "attendee-7",
      status: "checked-in",
    });
  });
});
