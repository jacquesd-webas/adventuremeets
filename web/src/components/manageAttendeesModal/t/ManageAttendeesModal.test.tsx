import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { ManageAttendeesModal } from "../ManageAttendeesModal";
import AttendeeStatusEnum from "../../../types/AttendeeStatusEnum";
import MeetStatusEnum from "../../../types/MeetStatusEnum";

const updateMeetAttendeeAsync = vi.fn();
const refetch = vi.fn();

vi.mock("../../../hooks/useFetchMeetAttendees", () => ({
  useFetchMeetAttendees: () => ({
    data: [
      {
        id: "a1",
        name: "Alex",
        status: AttendeeStatusEnum.Pending,
        email: "alex@example.com",
      },
    ],
    isLoading: false,
    refetch,
  }),
}));

vi.mock("../../../hooks/useFetchMeet", () => ({
  useFetchMeet: () => ({
    data: {
      id: "m1",
      organizerId: "org-1",
      statusId: MeetStatusEnum.Open,
    },
  }),
}));

vi.mock("../../../hooks/useUpdateMeetAttendee", () => ({
  useUpdateMeetAttendee: () => ({
    updateMeetAttendeeAsync,
  }),
}));

vi.mock("../MessageModal", () => ({
  MessageModal: ({ open }: { open: boolean }) =>
    open ? <div>Message modal</div> : null,
}));

vi.mock("../ConfirmClosedStatusDialog", () => ({
  ConfirmClosedStatusDialog: ({ open }: { open: boolean }) =>
    open ? <div>Confirm dialog</div> : null,
}));

describe("ManageAttendeesModal", () => {
  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
  });

  it("shows attendees and updates status", async () => {
    render(
      <ManageAttendeesModal open onClose={vi.fn()} meetId="m1" />
    );

    const list = await screen.findByRole("list");
    const listItem = within(list).getByRole("button", { name: /Alex/i });
    fireEvent.click(listItem);
    fireEvent.click(await screen.findByText("Accept"));

    await waitFor(() => {
      expect(updateMeetAttendeeAsync).toHaveBeenCalledWith({
        meetId: "m1",
        attendeeId: "a1",
        status: AttendeeStatusEnum.Confirmed,
      });
    });
  });

  it("opens the message modal from footer action", () => {
    render(
      <ManageAttendeesModal open onClose={vi.fn()} meetId="m1" />
    );

    fireEvent.click(screen.getByText("Send Message to All Attendees"));
    expect(screen.getByText("Message modal")).toBeInTheDocument();
  });
});
