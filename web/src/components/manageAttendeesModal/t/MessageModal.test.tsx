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
  useDefaultMessage: () => ({
    subject: "Auto subject",
    content: "Auto body",
  }),
}));

describe("MessageModal", () => {
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
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByText("Send"));
    expect(
      screen.getByText("Subject and message are required")
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
      </QueryClientProvider>
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
      });
    });
    expect(enqueueSnackbar).toHaveBeenCalled();
  });
});
