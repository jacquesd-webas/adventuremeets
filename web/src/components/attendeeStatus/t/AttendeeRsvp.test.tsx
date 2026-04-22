import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AttendeeStatusEnum from "../../../types/AttendeeStatusEnum";
import { AttendeeRsvp } from "../AttendeeRsvp";

const confirmAttendeeAsync = vi.fn();
const declineAttendeeAsync = vi.fn();
const success = vi.fn();
const error = vi.fn();
const navigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
}));

vi.mock("../../../hooks/useAttendeeRsvp", () => ({
  useAttendeeRsvp: () => ({
    confirmAttendeeAsync,
    declineAttendeeAsync,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../../hooks/useNotistack", () => ({
  useNotistack: () => ({
    success,
    error,
  }),
}));

describe("AttendeeRsvp", () => {
  beforeEach(() => {
    confirmAttendeeAsync.mockReset();
    declineAttendeeAsync.mockReset();
    success.mockReset();
    error.mockReset();
    navigate.mockReset();
    confirmAttendeeAsync.mockResolvedValue({ hasMissingFields: false });
    declineAttendeeAsync.mockResolvedValue({});
  });

  it("allows a preloaded attendee to confirm attendance", async () => {
    render(
      <AttendeeRsvp
        meetCode="share-123"
        attendeeId="attendee-1"
        status={AttendeeStatusEnum.Preloaded}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(confirmAttendeeAsync).toHaveBeenCalledWith({
        meetCode: "share-123",
        attendeeId: "attendee-1",
      });
    });

    expect(success).toHaveBeenCalledWith("Attendance confirmed");
    expect(navigate).toHaveBeenCalledWith("/meets/share-123/attendee-1");
  });

  it("navigates to edit when confirm response reports missing fields", async () => {
    confirmAttendeeAsync.mockResolvedValue({ hasMissingFields: true });

    render(
      <AttendeeRsvp
        meetCode="share-123"
        attendeeId="attendee-1"
        status={AttendeeStatusEnum.Preloaded}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith(
        "/meets/share-123/attendee-1?action=edit",
      );
    });
  });

  it("declines attendance without navigating to edit", async () => {
    render(
      <AttendeeRsvp
        meetCode="share-123"
        attendeeId="attendee-1"
        status={AttendeeStatusEnum.Preloaded}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Decline" }));

    await waitFor(() => {
      expect(declineAttendeeAsync).toHaveBeenCalledWith({
        meetCode: "share-123",
        attendeeId: "attendee-1",
      });
    });

    expect(success).toHaveBeenCalledWith("Attendance declined");
  });

  it("falls back to the status alert for unsupported RSVP statuses", () => {
    const { container } = render(
      <AttendeeRsvp
        meetCode="share-123"
        attendeeId="attendee-1"
        status={AttendeeStatusEnum.Waitlisted}
      />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(
      screen.queryByRole("button", { name: "Confirm" }),
    ).not.toBeInTheDocument();
  });
});
