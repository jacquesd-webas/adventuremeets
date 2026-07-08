import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ManageAttendeesModal } from "../ManageAttendeesModal";
import AttendeeStatusEnum from "../../../types/AttendeeStatusEnum";
import MeetStatusEnum from "../../../types/MeetStatusEnum";

const updateMeetAttendeeAsync = vi.fn();
const notifyAttendeeAsync = vi.fn();
const refetch = vi.fn();
const onClose = vi.fn();

let mockAttendees = [
  {
    id: "a1",
    name: "Alex",
    status: AttendeeStatusEnum.Pending,
    email: "alex@example.com",
  },
];

let mockMeet = {
  id: "m1",
  organizerId: "org-1",
  statusId: MeetStatusEnum.Open,
};

vi.mock("../../../hooks/useFetchMeetAttendees", () => ({
  useFetchMeetAttendees: () => ({
    data: mockAttendees,
    isLoading: false,
    refetch,
  }),
}));

vi.mock("../../../hooks/useFetchMeet", () => ({
  useFetchMeet: () => ({
    data: mockMeet,
  }),
}));

vi.mock("../../../hooks/useUpdateMeetAttendee", () => ({
  useUpdateMeetAttendee: () => ({
    updateMeetAttendeeAsync,
  }),
}));

vi.mock("../../../hooks/useNotifyAttendee", () => ({
  useNotifyAttendee: () => ({
    notifyAttendeeAsync,
    isLoading: false,
  }),
}));

vi.mock("../../../hooks/useFetchAttendeeMessages", () => ({
  useFetchAttendeeMessages: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../../hooks/useFetchAttendeeHistory", () => ({
  useFetchAttendeeHistory: () => ({
    data: [],
    isLoading: false,
    error: null,
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

vi.mock("../../../hooks/useNotistack", () => ({
  useNotistack: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

vi.mock("notistack", () => ({
  useSnackbar: () => ({
    enqueueSnackbar: vi.fn(),
  }),
  SnackbarProvider: ({ children }: { children: any }) => children,
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

  const setMatchMedia = (matches: boolean) => {
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
    setMatchMedia(false);
    vi.useRealTimers();
    updateMeetAttendeeAsync.mockReset();
    notifyAttendeeAsync.mockReset();
    refetch.mockReset();
    onClose.mockReset();
    mockAttendees = [
      {
        id: "a1",
        name: "Alex",
        status: AttendeeStatusEnum.Pending,
        email: "alex@example.com",
      },
    ];
    mockMeet = {
      id: "m1",
      organizerId: "org-1",
      statusId: MeetStatusEnum.Open,
      name: "River Hike",
      confirmMessage: "Confirmed custom body",
      waitlistMessage: "Waitlisted custom body",
      rejectMessage: "Rejected custom body",
    };
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("shows attendees and updates status", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ManageAttendeesModal
          open
          onClose={onClose}
          meetId="m1"
          isOrganizer
          canManageMeet
        />
      </QueryClientProvider>,
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
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ManageAttendeesModal
          open
          onClose={onClose}
          meetId="m1"
          isOrganizer
          canManageMeet
        />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByText("Send Message to All Attendees"));
    expect(screen.getByText("Message modal")).toBeInTheDocument();
  });

  it("closes the mobile attendee drawer before opening the message modal", async () => {
    setMatchMedia(true);
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ManageAttendeesModal
          open
          onClose={onClose}
          meetId="m1"
          isOrganizer
          canManageMeet
        />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Alex/i }));
    fireEvent.click(
      await screen.findByRole("button", { name: /Message Alex/i }),
    );

    expect(screen.queryByText("Message modal")).not.toBeInTheDocument();

    expect(await screen.findByText("Message modal")).toBeInTheDocument();
  });

  it("closes immediately without notify prompt when the user is not the organizer", () => {
    mockAttendees = [
      {
        id: "a1",
        name: "Alex",
        status: AttendeeStatusEnum.Confirmed,
        email: "alex@example.com",
      },
    ];

    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ManageAttendeesModal open onClose={onClose} meetId="m1" />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByTestId("close-attendees-modal"));

    expect(onClose).toHaveBeenCalled();
    expect(screen.queryByText("Notify attendees?")).not.toBeInTheDocument();
  });

  it("closes immediately without notify prompt when the meet is completed", () => {
    mockAttendees = [
      {
        id: "a1",
        name: "Alex",
        status: AttendeeStatusEnum.Confirmed,
        email: "alex@example.com",
      },
    ];
    mockMeet = {
      id: "m1",
      organizerId: "org-1",
      statusId: MeetStatusEnum.Completed,
    };

    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ManageAttendeesModal
          open
          onClose={onClose}
          meetId="m1"
          isOrganizer
          canManageMeet
        />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByTestId("close-attendees-modal"));

    expect(onClose).toHaveBeenCalled();
    expect(screen.queryByText("Notify attendees?")).not.toBeInTheDocument();
  });

  it("groups close notifications by attendee status", async () => {
    mockAttendees = [
      {
        id: "invited-1",
        name: "Invited Person",
        status: AttendeeStatusEnum.Invited,
        email: "invited@example.com",
      },
      {
        id: "confirmed-1",
        name: "Confirmed Person",
        status: AttendeeStatusEnum.Confirmed,
        email: "confirmed@example.com",
      },
      {
        id: "waitlisted-1",
        name: "Waitlisted Person",
        status: AttendeeStatusEnum.Waitlisted,
        email: "waitlisted@example.com",
      },
      {
        id: "rejected-1",
        name: "Rejected Person",
        status: AttendeeStatusEnum.Rejected,
        email: "rejected@example.com",
      },
    ];

    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ManageAttendeesModal
          open
          onClose={onClose}
          meetId="m1"
          isOrganizer
          canManageMeet
        />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByTestId("close-attendees-modal"));
    fireEvent.click(await screen.findByRole("button", { name: "Notify now" }));

    await waitFor(() => {
      expect(notifyAttendeeAsync).toHaveBeenCalledTimes(4);
    });

    expect(notifyAttendeeAsync).toHaveBeenNthCalledWith(1, {
      meetId: "m1",
      subject: "Invitation: River Hike",
      text: "You have been invited to join this meet. Please open your meet link to confirm or update your attendance.",
      attendeeIds: ["invited-1"],
    });
    expect(notifyAttendeeAsync).toHaveBeenNthCalledWith(2, {
      meetId: "m1",
      subject: "Confirmed: River Hike",
      text: "Confirmed custom body",
      attendeeIds: ["confirmed-1"],
    });
    expect(notifyAttendeeAsync).toHaveBeenNthCalledWith(3, {
      meetId: "m1",
      subject: "Waitlist: River Hike",
      text: "Waitlisted custom body",
      attendeeIds: ["waitlisted-1"],
    });
    expect(notifyAttendeeAsync).toHaveBeenNthCalledWith(4, {
      meetId: "m1",
      subject: "Update: River Hike",
      text: "Rejected custom body",
      attendeeIds: ["rejected-1"],
    });
  });

  it("shows the notify dialog for invited attendees who have not been notified", async () => {
    mockAttendees = [
      {
        id: "invited-1",
        name: "Invited Person",
        status: AttendeeStatusEnum.Invited,
        email: "invited@example.com",
      },
    ];

    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ManageAttendeesModal
          open
          onClose={onClose}
          meetId="m1"
          isOrganizer
          canManageMeet
        />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByTestId("close-attendees-modal"));

    expect(await screen.findByText("Notify attendees?")).toBeInTheDocument();
  });

  it("disables attendee uploads until a non-organizer unlocks the meet", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ManageAttendeesModal
          open
          onClose={onClose}
          meetId="m1"
          canManageMeet
        />
      </QueryClientProvider>,
    );

    const uploadButton = screen.getByRole("button", {
      name: "Upload attendees",
    });
    expect(uploadButton).toHaveAttribute("aria-disabled", "true");

    fireEvent.click(screen.getByLabelText("Unlock meet"));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Upload attendees" }),
      ).not.toHaveAttribute("aria-disabled");
    });
  });
});
