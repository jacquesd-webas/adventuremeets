import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import MeetSelfCheckinPage from "../MeetSelfCheckinPage";

const checkAttendeeAsync = vi.fn();
const updateMeetAttendeeByCodeAsync = vi.fn();
const addAttendeeAsync = vi.fn();

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

vi.mock("../../hooks/useAddAttendee", () => ({
  useAddAttendee: () => ({
    addAttendeeAsync,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../components/meet/MeetInfoSummary", () => ({
  MeetInfoSummary: ({ meet }: { meet: { name: string } }) => <div>{meet.name}</div>,
}));

vi.mock("../../components/meet/MeetNotFound", () => ({
  MeetNotFound: () => <div>Meet not found</div>,
}));

describe("MeetSelfCheckinPage", () => {
  beforeEach(() => {
    checkAttendeeAsync.mockReset();
    updateMeetAttendeeByCodeAsync.mockReset();
    addAttendeeAsync.mockReset();
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
          <Route path="/meets/:code/checkin" element={<MeetSelfCheckinPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Meet not found")).toBeInTheDocument();
  });

  it("matches an attendee and checks them in", async () => {
    const user = userEvent.setup();
    checkAttendeeAsync.mockResolvedValue({
      attendee: { id: "attendee-1", name: "Alex Example" },
    });
    updateMeetAttendeeByCodeAsync.mockResolvedValue({});

    render(
      <MemoryRouter initialEntries={["/meets/share-123/checkin?pin=PIN123"]}>
        <Routes>
          <Route path="/meets/:code/checkin" element={<MeetSelfCheckinPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText("Your name"), "Alex Example");
    await user.type(
      screen.getByPlaceholderText("you@example.com"),
      "alex@example.com",
    );
    await user.click(screen.getByRole("button", { name: "Check in" }));

    await waitFor(() => {
      expect(checkAttendeeAsync).toHaveBeenCalledWith({
        meetId: "meet-1",
        email: "alex@example.com",
        phone: undefined,
      });
    });

    expect(updateMeetAttendeeByCodeAsync).toHaveBeenCalledWith({
      meetCode: "share-123",
      attendeeId: "attendee-1",
      status: "checked-in",
    });
  });

  it("creates a walk-in and checks them in when no attendee matches", async () => {
    const user = userEvent.setup();
    mockMeet = {
      ...mockMeet,
      allowWalkins: true,
    };
    checkAttendeeAsync.mockResolvedValue({ attendee: null });
    addAttendeeAsync.mockResolvedValue({ attendee: { id: "attendee-2" } });
    updateMeetAttendeeByCodeAsync.mockResolvedValue({});

    render(
      <MemoryRouter initialEntries={["/meets/share-123/checkin?pin=PIN123"]}>
        <Routes>
          <Route path="/meets/:code/checkin" element={<MeetSelfCheckinPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText("Your name"), "Taylor Trail");
    await user.type(
      screen.getByPlaceholderText("you@example.com"),
      "taylor@example.com",
    );
    await user.click(screen.getByRole("button", { name: "Check in" }));

    await waitFor(() => {
      expect(addAttendeeAsync).toHaveBeenCalledWith({
        meetId: "meet-1",
        userId: undefined,
        name: "Taylor Trail",
        email: "taylor@example.com",
        phone: undefined,
        isMinor: false,
        GuardianName: undefined,
      });
    });

    expect(updateMeetAttendeeByCodeAsync).toHaveBeenCalledWith({
      meetCode: "share-123",
      attendeeId: "attendee-2",
      status: "checked-in",
    });
  });
});
