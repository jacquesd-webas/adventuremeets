import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AttendeeMessages } from "../AttendeeMessages";

const markRead = vi.fn();

vi.mock("../../../hooks/useFetchAttendeeMessages", () => ({
  useFetchAttendeeMessages: () => ({
    data: [
      {
        id: "received-message",
        content: "Subject: Received\n\nUnread incoming message",
        isRead: false,
        direction: "received",
      },
      {
        id: "sent-message",
        content: "Subject: Sent\n\nUnread outgoing message",
        isRead: false,
        direction: "sent",
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../../hooks/useMarkAttendeeMessageRead", () => ({
  useMarkAttendeeMessageRead: () => ({ markRead }),
}));

describe("AttendeeMessages", () => {
  beforeEach(() => {
    markRead.mockReset();
  });

  it("marks unread sent and received messages as read when expanded", () => {
    render(
      <AttendeeMessages
        meetId="meet-1"
        attendeeId="attendee-1"
        attendeeEmail="attendee@example.com"
      />,
    );

    const receivedMessage = screen
      .getByText("Received")
      .closest("[aria-expanded]");
    const sentMessage = screen.getByText("Sent").closest("[aria-expanded]");
    expect(receivedMessage).toHaveAttribute("aria-expanded", "false");
    expect(sentMessage).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(receivedMessage!);
    fireEvent.click(sentMessage!);

    expect(receivedMessage).toHaveAttribute("aria-expanded", "true");
    expect(sentMessage).toHaveAttribute("aria-expanded", "true");
    expect(markRead).toHaveBeenCalledTimes(2);
    expect(markRead).toHaveBeenNthCalledWith(1, {
      meetId: "meet-1",
      attendeeId: "attendee-1",
      messageId: "received-message",
    });
    expect(markRead).toHaveBeenNthCalledWith(2, {
      meetId: "meet-1",
      attendeeId: "attendee-1",
      messageId: "sent-message",
    });

    fireEvent.click(receivedMessage!);

    expect(receivedMessage).toHaveAttribute("aria-expanded", "false");
    expect(markRead).toHaveBeenCalledTimes(2);
  });
});
