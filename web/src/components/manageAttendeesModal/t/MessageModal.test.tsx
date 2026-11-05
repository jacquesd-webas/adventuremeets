import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MessageModal } from "../MessageModal";
import AttendeeStatusEnum from "../../../types/AttendeeStatusEnum";

const enqueueSnackbar = vi.fn();
const notifyAttendeeAsync = vi.fn();
const previewPost = vi.fn();

vi.mock("../../../hooks/useApi", () => ({
  useApi: () => ({ post: previewPost }),
}));

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
    notifyAttendeeAsync.mockResolvedValue(undefined);
    previewPost.mockReset();
  });

  it("renders a manual message preview without sending it", async () => {
    previewPost.mockResolvedValue({
      previews: [
        {
          from: "Taylor (Aventuremeets) <organiser@example.com>",
          to: "alex@example.com",
          subject: "Bring a shell",
          attendeeName: "Alex",
          html: "<html><body><a href='/meet'>View meet</a></body></html>",
        },
      ],
    });
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MessageModal
          open
          onClose={vi.fn()}
          meet={{ id: "m1", name: "Meet" } as any}
          attendeeIds={["a1"]}
          attendees={[
            { id: "a1", name: "Alex", status: AttendeeStatusEnum.Confirmed },
          ]}
        />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "Bring a shell" },
    });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "Please bring a shell." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));

    await waitFor(() => {
      expect(previewPost).toHaveBeenCalledWith("/meets/m1/message/preview", {
        messages: [
          {
            attendeeIds: ["a1"],
            subject: "Bring a shell",
            text: "Please bring a shell.",
            includeStatusUrl: true,
            sendAsGroup: false,
          },
        ],
      });
      expect(screen.getByTitle("Email preview 1")).toHaveAttribute(
        "srcdoc",
        "<html><body><a href='/meet'>View meet</a></body></html>",
      );
      expect(screen.getByText("From:")).toBeInTheDocument();
      expect(screen.getByText("To:")).toBeInTheDocument();
      expect(screen.getByText("Subject:")).toBeInTheDocument();
      expect(
        screen.getByText("Taylor (Aventuremeets) <organiser@example.com>"),
      ).toBeInTheDocument();
      expect(screen.getByText("alex@example.com")).toBeInTheDocument();
    });
    expect(notifyAttendeeAsync).not.toHaveBeenCalled();
  });

  it("previews each selected automatic recipient group separately", async () => {
    previewPost.mockResolvedValue({
      previews: [
        {
          from: "Organizer <organiser@example.com>",
          to: "alex@example.com",
          subject: "Confirmed",
          attendeeName: "Alex",
          html: "<p>Confirmed</p>",
        },
        {
          from: "Organizer <organiser@example.com>",
          to: "jamie@example.com",
          subject: "Waitlisted",
          attendeeName: "Jamie",
          html: "<p>Waitlisted</p>",
        },
      ],
    });
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MessageModal
          open
          onClose={vi.fn()}
          meet={{ id: "m1", name: "Meet" } as any}
          attendees={[
            { id: "a1", name: "Alex", status: AttendeeStatusEnum.Confirmed },
            { id: "a2", name: "Jamie", status: AttendeeStatusEnum.Waitlisted },
          ]}
        />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Waitlisted" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Auto" }));
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));

    await waitFor(() => {
      expect(previewPost).toHaveBeenCalledWith("/meets/m1/message/preview", {
        messages: [
          {
            attendeeIds: ["a1"],
            subject: "Auto subject",
            text: "Auto body",
            includeStatusUrl: true,
            sendAsGroup: false,
          },
          {
            attendeeIds: ["a2"],
            subject: "Auto subject",
            text: "Auto body",
            includeStatusUrl: true,
            sendAsGroup: false,
          },
        ],
      });
      expect(screen.getByText("Confirmed attendees")).toBeInTheDocument();
      expect(screen.getByText("Waitlisted attendees")).toBeInTheDocument();
      expect(screen.getByTitle("Email preview 2")).toHaveAttribute(
        "srcdoc",
        "<p>Waitlisted</p>",
      );
    });
    expect(notifyAttendeeAsync).not.toHaveBeenCalled();
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
        sendAsGroup: false,
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

    fireEvent.click(
      screen.getByRole("checkbox", { name: "Mark attendee(s) as notified" }),
    );
    fireEvent.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(notifyAttendeeAsync).toHaveBeenCalledWith({
        meetId: "m1",
        subject: "Hello",
        text: "Body",
        attendeeIds: ["a1"],
        markNotified: true,
        includeStatusUrl: true,
        sendAsGroup: false,
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
        sendAsGroup: false,
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
        sendAsGroup: false,
      });
    });
  });

  it("sends to checked-in and attended attendees when checked-in is selected", async () => {
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
    fireEvent.click(screen.getByRole("checkbox", { name: "Checked-in" }));
    fireEvent.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(notifyAttendeeAsync).toHaveBeenNthCalledWith(1, {
        meetId: "m1",
        subject: "Hello",
        text: "Body",
        attendeeIds: ["confirmed-1"],
        markNotified: false,
        includeStatusUrl: true,
        sendAsGroup: false,
      });
      expect(notifyAttendeeAsync).toHaveBeenNthCalledWith(2, {
        meetId: "m1",
        subject: "Hello",
        text: "Body",
        attendeeIds: ["checked-in-1"],
        markNotified: false,
        includeStatusUrl: true,
        sendAsGroup: false,
      });
      expect(notifyAttendeeAsync).toHaveBeenNthCalledWith(3, {
        meetId: "m1",
        subject: "Hello",
        text: "Body",
        attendeeIds: ["attended-1"],
        markNotified: false,
        includeStatusUrl: true,
        sendAsGroup: false,
      });
      expect(notifyAttendeeAsync).toHaveBeenCalledTimes(3);
    });
  });

  it("shows the bulk recipient switches", () => {
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
      screen.getByText("Who should we send the message to?"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Confirmed" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Checked-in" })).toBeDisabled();
    expect(
      screen.getByRole("checkbox", { name: "Waitlisted" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Rejected" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Invited" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Custom" })).toBeDisabled();
    expect(
      screen.getByTestId("message-recipient-grid").querySelectorAll("input"),
    ).toHaveLength(6);
  });

  it("disables the invited switch when there are no invited attendees", () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MessageModal
          open
          onClose={vi.fn()}
          meet={{ id: "m1", name: "Meet" } as any}
          attendees={[
            { id: "confirmed-1", status: AttendeeStatusEnum.Confirmed },
          ]}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("checkbox", { name: "Invited" })).toBeDisabled();
  });

  it("enables checked-in only when a checked-in attendee exists", () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MessageModal
          open
          onClose={vi.fn()}
          meet={{ id: "m1", name: "Meet" } as any}
          attendees={[
            { id: "checked-in-1", status: AttendeeStatusEnum.CheckedIn },
          ]}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("checkbox", { name: "Checked-in" })).toBeEnabled();
  });

  it("sends the checked-in automatic message only to checked-in attendees", async () => {
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
          ]}
        />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Confirmed" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Checked-in" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Auto" }));
    await waitFor(() => {
      expect(screen.getByLabelText("Message")).toHaveValue("Auto body");
    });
    fireEvent.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(notifyAttendeeAsync).toHaveBeenCalledWith({
        meetId: "m1",
        subject: "Auto subject",
        text: "Auto body",
        attendeeIds: ["checked-in-1"],
        markNotified: true,
        includeStatusUrl: true,
        sendAsGroup: false,
      });
      expect(notifyAttendeeAsync).toHaveBeenCalledTimes(1);
    });
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
    fireEvent.click(screen.getByRole("checkbox", { name: "Invited" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Confirmed" }));
    fireEvent.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(notifyAttendeeAsync).toHaveBeenCalledWith({
        meetId: "m1",
        subject: "Hello",
        text: "Body",
        attendeeIds: ["invited-1"],
        markNotified: false,
        includeStatusUrl: true,
        sendAsGroup: false,
      });
    });
  });

  it("can send a bulk message as a group message", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MessageModal
          open
          onClose={vi.fn()}
          meet={{ id: "m1", name: "Meet" } as any}
          attendees={[
            { id: "confirmed-1", status: AttendeeStatusEnum.Confirmed },
            { id: "confirmed-2", status: AttendeeStatusEnum.CheckedIn },
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
    fireEvent.click(screen.getByRole("checkbox", { name: "Checked-in" }));
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Send as a group message",
      }),
    );
    expect(
      screen.getByText(/later bounces cannot be tracked per attendee/i),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(notifyAttendeeAsync).toHaveBeenCalledWith({
        meetId: "m1",
        subject: "Hello",
        text: "Body",
        attendeeIds: ["confirmed-1", "confirmed-2"],
        markNotified: false,
        includeStatusUrl: true,
        sendAsGroup: true,
      });
    });
  });

  it("disables group send for auto messages when multiple status groups are selected", () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MessageModal
          open
          onClose={vi.fn()}
          meet={{ id: "m1", name: "Meet" } as any}
          attendees={[
            { id: "confirmed-1", status: AttendeeStatusEnum.Confirmed },
            { id: "confirmed-2", status: AttendeeStatusEnum.CheckedIn },
            { id: "invited-1", status: AttendeeStatusEnum.Invited },
          ]}
        />
      </QueryClientProvider>,
    );

    const groupCheckbox = screen.getByRole("checkbox", {
      name: "Send as a group message",
    });

    fireEvent.click(groupCheckbox);
    expect(groupCheckbox).toBeChecked();

    fireEvent.click(screen.getByRole("checkbox", { name: "Auto" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Invited" }));

    expect(groupCheckbox).toBeDisabled();
    expect(groupCheckbox).not.toBeChecked();
  });

  it("keeps group send enabled for auto messages when only one status group is selected", () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MessageModal
          open
          onClose={vi.fn()}
          meet={{ id: "m1", name: "Meet" } as any}
          attendees={[
            { id: "confirmed-1", status: AttendeeStatusEnum.Confirmed },
            { id: "confirmed-2", status: AttendeeStatusEnum.CheckedIn },
          ]}
        />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Auto" }));

    expect(
      screen.getByRole("checkbox", { name: "Send as a group message" }),
    ).toBeEnabled();
  });

  it("splits bulk auto messages by attendee status", async () => {
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
            { id: "waitlisted-1", status: AttendeeStatusEnum.Waitlisted },
          ]}
        />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Auto" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Invited" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Waitlisted" }));
    fireEvent.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(notifyAttendeeAsync).toHaveBeenNthCalledWith(1, {
        meetId: "m1",
        subject: "Invitation: Meet",
        text: "Invitation body",
        attendeeIds: ["invited-1"],
        markNotified: true,
        includeStatusUrl: true,
        sendAsGroup: false,
      });
      expect(notifyAttendeeAsync).toHaveBeenNthCalledWith(2, {
        meetId: "m1",
        subject: "Auto subject",
        text: "Auto body",
        attendeeIds: ["confirmed-1"],
        markNotified: true,
        includeStatusUrl: true,
        sendAsGroup: false,
      });
      expect(notifyAttendeeAsync).toHaveBeenNthCalledWith(3, {
        meetId: "m1",
        subject: "Auto subject",
        text: "Auto body",
        attendeeIds: ["waitlisted-1"],
        markNotified: true,
        includeStatusUrl: true,
        sendAsGroup: false,
      });
    });
  });

  it("shows progress while sending multiple messages", async () => {
    const queryClient = new QueryClient();
    let resolveSend: (() => void) | null = null;
    notifyAttendeeAsync.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveSend = resolve;
        }),
    );
    render(
      <QueryClientProvider client={queryClient}>
        <MessageModal
          open
          onClose={vi.fn()}
          meet={{ id: "m1", name: "Meet" } as any}
          attendees={[
            { id: "confirmed-1", status: AttendeeStatusEnum.Confirmed },
            { id: "confirmed-2", status: AttendeeStatusEnum.Confirmed },
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

    expect(screen.getByText("Sending messages")).toBeInTheDocument();
    expect(
      screen.getByText((content) => /Sent [01] of 2 messages/.test(content)),
    ).toBeInTheDocument();

    await act(async () => {
      resolveSend?.();
    });
  });

  it("shows each checkbox help alert independently", () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MessageModal
          open
          onClose={vi.fn()}
          meet={{ id: "m1", name: "Meet" } as any}
          attendees={[
            {
              id: "confirmed-1",
              status: AttendeeStatusEnum.Confirmed,
              respondedAt: null,
            },
          ]}
        />
      </QueryClientProvider>,
    );

    expect(
      screen.queryByText(/group messages send one email to all the selected/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/manual messages do not mark attendees as notified/i),
    ).not.toBeInTheDocument();

    fireEvent.mouseOver(
      screen.getAllByRole("button", { name: "What is this?" })[0],
    );
    fireEvent.click(
      screen.getAllByRole("button", { name: "What is this?" })[0],
    );

    expect(
      screen.getByText(/group messages send one email to all the selected/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/manual messages do not mark attendees as notified/i),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getAllByRole("button", { name: "What is this?" })[1],
    );

    expect(
      screen.getByText(/manual messages do not mark attendees as notified/i),
    ).toBeInTheDocument();
  });
});
