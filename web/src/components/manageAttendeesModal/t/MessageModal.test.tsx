import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MessageModal } from "../MessageModal";
import AttendeeStatusEnum from "../../../types/AttendeeStatusEnum";

const enqueueSnackbar = vi.fn();
const notifyAttendeeAsync = vi.fn();

vi.mock("notistack", () => ({
  useSnackbar: () => ({ enqueueSnackbar }),
}));

vi.mock("../../../hooks/useNotifyAttendee", () => ({
  useNotifyAttendee: () => ({
    notifyAttendeeAsync,
    isLoading: false,
  }),
}));

vi.mock("../../../hooks/useDefaultMessage", () => ({
  useDefaultMessage: (status?: AttendeeStatusEnum | null) => {
    if (status === AttendeeStatusEnum.Invited) {
      return {
        subject: "Invitation: Meet",
        content: "Invitation body",
      };
    }
    return {
      subject: "Auto subject",
      content: "Auto body",
    };
  },
}));

describe("MessageModal", () => {
  beforeEach(() => {
    enqueueSnackbar.mockClear();
    notifyAttendeeAsync.mockClear();
  });

  it("validates required fields", () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MessageModal
          open
          onClose={vi.fn()}
          meet={{ id: "m1", name: "Meet" } as any}
          attendeeIds={["a1"]}
        />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByText("Send"));
    expect(
      screen.getByText("Subject, message and meet ID are required"),
    ).toBeInTheDocument();
  });

  it("sends a message to attendee ids", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MessageModal
          open
          onClose={vi.fn()}
          meet={{ id: "m1", name: "Meet" } as any}
          attendeeIds={["a1"]}
          attendees={[{ id: "a1", status: AttendeeStatusEnum.Confirmed }]}
        />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "Hello" },
    });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "Body" },
    });
    fireEvent.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(notifyAttendeeAsync).toHaveBeenCalledWith({
        meetId: "m1",
        subject: "Hello",
        text: "Body",
        attendeeIds: ["a1"],
        markNotified: false,
        includeStatusUrl: true,
      });
    });
    expect(enqueueSnackbar).toHaveBeenCalled();
  });

  it("allows marking attendees as notified for manual messages", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MessageModal
          open
          onClose={vi.fn()}
          meet={{ id: "m1", name: "Meet" } as any}
          attendeeIds={["a1"]}
          attendees={[{ id: "a1", status: AttendeeStatusEnum.Confirmed }]}
        />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "Hello" },
    });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "Body" },
    });

    fireEvent.click(screen.getByLabelText("Mark attendee as notified"));
    fireEvent.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(notifyAttendeeAsync).toHaveBeenCalledWith({
        meetId: "m1",
        subject: "Hello",
        text: "Body",
        attendeeIds: ["a1"],
        markNotified: true,
        includeStatusUrl: true,
      });
    });
  });

  it("marks attendees as notified when auto is enabled", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MessageModal
          open
          onClose={vi.fn()}
          meet={{ id: "m1", name: "Meet" } as any}
          attendeeIds={["a1"]}
          attendees={[{ id: "a1", status: AttendeeStatusEnum.Confirmed }]}
        />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Auto" }));
    fireEvent.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(notifyAttendeeAsync).toHaveBeenCalledWith({
        meetId: "m1",
        subject: "Auto subject",
        text: "Auto body",
        attendeeIds: ["a1"],
        markNotified: true,
        includeStatusUrl: true,
      });
    });
  });

  it("sends an invitation for an invited attendee when auto is enabled", async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MessageModal
          open
          onClose={vi.fn()}
          meet={{ id: "m1", name: "Meet" } as any}
          attendeeIds={["a1"]}
          attendees={[
            {
              id: "a1",
              status: AttendeeStatusEnum.Invited,
              respondedAt: null,
            },
          ]}
        />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Auto" }));
    fireEvent.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(notifyAttendeeAsync).toHaveBeenCalledWith({
        meetId: "m1",
        subject: "Invitation: Meet",
        text: "Invitation body",
        attendeeIds: ["a1"],
        markNotified: true,
        includeStatusUrl: true,
      });
    });
  });

  it("includes checked-in and attended attendees in the confirmed group send", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MessageModal
          open
          onClose={vi.fn()}
          meet={{ id: "m1", name: "Meet" } as any}
          attendees={[
            { id: "confirmed-1", status: AttendeeStatusEnum.Confirmed },
            { id: "checked-in-1", status: AttendeeStatusEnum.CheckedIn },
            { id: "attended-1", status: AttendeeStatusEnum.Attended },
            { id: "waitlisted-1", status: AttendeeStatusEnum.Waitlisted },
          ]}
        />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "Hello" },
    });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "Body" },
    });
    fireEvent.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(notifyAttendeeAsync).toHaveBeenCalledWith({
        meetId: "m1",
        subject: "Hello",
        text: "Body",
        attendeeIds: ["confirmed-1", "checked-in-1", "attended-1"],
        markNotified: false,
        includeStatusUrl: true,
      });
    });
  });

  it("shows an invited-attendees switch when invited attendees exist", () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MessageModal
          open
          onClose={vi.fn()}
          meet={{ id: "m1", name: "Meet" } as any}
          attendees={[
            { id: "invited-1", status: AttendeeStatusEnum.Invited },
            { id: "confirmed-1", status: AttendeeStatusEnum.Confirmed },
          ]}
        />
      </QueryClientProvider>,
    );

    expect(
      screen.getByRole("checkbox", { name: "Send to invited attendees" }),
    ).toBeInTheDocument();
  });

  it("can send to invited attendees from the bulk message modal", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MessageModal
          open
          onClose={vi.fn()}
          meet={{ id: "m1", name: "Meet" } as any}
          attendees={[
            { id: "invited-1", status: AttendeeStatusEnum.Invited },
            { id: "confirmed-1", status: AttendeeStatusEnum.Confirmed },
          ]}
        />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "Hello" },
    });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "Body" },
    });
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Send to invited attendees" }),
    );
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Send to confirmed attendees" }),
    );
    fireEvent.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(notifyAttendeeAsync).toHaveBeenCalledWith({
        meetId: "m1",
        subject: "Hello",
        text: "Body",
        attendeeIds: ["invited-1"],
        markNotified: false,
        includeStatusUrl: true,
      });
    });
  });
});
