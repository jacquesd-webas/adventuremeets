import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfirmPostponeMeetDialog } from "../ConfirmPostponeMeetDialog";
import MeetStatusEnum from "../../../types/MeetStatusEnum";

const mocks = vi.hoisted(() => ({
  updateStatusAsync: vi.fn(),
  notifyAttendeeAsync: vi.fn(),
}));

vi.mock("../../../hooks/useUpdateMeetStatus", () => ({
  useUpdateMeetStatus: () => ({
    updateStatusAsync: mocks.updateStatusAsync,
    isLoading: false,
  }),
}));

vi.mock("../../../hooks/useNotifyAttendee", () => ({
  useNotifyAttendee: () => ({
    notifyAttendeeAsync: mocks.notifyAttendeeAsync,
    isLoading: false,
  }),
}));

vi.mock("../../../hooks/useFetchMeet", () => ({
  useFetchMeet: () => ({
    data: { id: "123", name: "River Hike" },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("../../../hooks/useFetchMeetAttendees", () => ({
  useFetchMeetAttendees: () => ({
    data: [
      { id: "attendee-1" },
      { id: "attendee-2" },
    ],
    isLoading: false,
    isOfflineData: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe("ConfirmPostponeMeetDialog", () => {
  beforeEach(() => {
    mocks.updateStatusAsync.mockReset();
    mocks.notifyAttendeeAsync.mockReset();
    mocks.updateStatusAsync.mockResolvedValue({});
    mocks.notifyAttendeeAsync.mockResolvedValue({});
  });

  it("notifies attendees before updating the meet status when a message is provided", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ConfirmPostponeMeetDialog
          open
          meetId="123"
          onConfirm={onConfirm}
          onClose={onClose}
        />
      </QueryClientProvider>
    );

    const messageField = screen.getByLabelText(/Message to participants/i);
    fireEvent.change(messageField, {
      target: { value: "  Delayed due to weather  " },
    });

    fireEvent.click(screen.getByRole("button", { name: /^Postpone$/i }));

    await waitFor(() => {
      expect(mocks.notifyAttendeeAsync).toHaveBeenCalledWith({
        meetId: "123",
        subject: "River Hike has been postponed",
        text: "Delayed due to weather",
        attendeeIds: ["attendee-1", "attendee-2"],
        markNotified: true,
      });
      expect(mocks.updateStatusAsync).toHaveBeenCalledWith({
        meetId: "123",
        statusId: MeetStatusEnum.Postponed,
      });
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    expect(
      mocks.notifyAttendeeAsync.mock.invocationCallOrder[0],
    ).toBeLessThan(mocks.updateStatusAsync.mock.invocationCallOrder[0]);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("updates the meet status without sending a notification when the message is empty", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ConfirmPostponeMeetDialog
          open
          meetId="123"
          onConfirm={onConfirm}
          onClose={onClose}
        />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /^Postpone$/i }));

    await waitFor(() => {
      expect(mocks.notifyAttendeeAsync).not.toHaveBeenCalled();
      expect(mocks.updateStatusAsync).toHaveBeenCalledWith({
        meetId: "123",
        statusId: MeetStatusEnum.Postponed,
      });
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not update the meet status when attendee notification fails", async () => {
    mocks.notifyAttendeeAsync.mockRejectedValueOnce(new Error("Mail failed"));

    const onConfirm = vi.fn();
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ConfirmPostponeMeetDialog
          open
          meetId="123"
          onConfirm={onConfirm}
          onClose={vi.fn()}
        />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByLabelText(/Message to participants/i), {
      target: { value: "Weather delay" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Postpone$/i }));

    await waitFor(() => {
      expect(mocks.notifyAttendeeAsync).toHaveBeenCalledTimes(1);
    });

    expect(mocks.updateStatusAsync).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
