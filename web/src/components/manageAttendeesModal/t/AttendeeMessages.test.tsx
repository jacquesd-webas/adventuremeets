import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AttendeeMessages } from "../AttendeeMessages";
import { AttendeeAuditEntry } from "../AttendeeAuditEntry";

const markRead = vi.fn();
const resend = vi.fn();

vi.mock("../../../hooks/useFetchAttendeeMessages", () => ({
  useFetchAttendeeMessages: () => ({
    data: [
      {
        id: "received-message",
        timestamp: "2026-10-20T11:00:00Z",
        content: "Subject: Received\n\nUnread incoming message",
        isRead: false,
        direction: "received",
      },
      {
        id: "sent-message",
        timestamp: "2026-10-20T09:00:00Z",
        content: "Subject: Sent\n\nUnread outgoing message",
        isRead: false,
        direction: "sent",
      },
      {
        id: "failed-message",
        content: "Subject: Failed\n\nPlease resend this",
        direction: "sent",
        emailStatus: "failed",
      },
    ],
    auditLogs: [
      {
        id: "audit-1",
        timestamp: "2026-10-20T10:00:00Z",
        description: "Taylor accepted application for meet Sunrise Hike",
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../../hooks/useMarkAttendeeMessageRead", () => ({
  useMarkAttendeeMessageRead: () => ({ markRead }),
}));

vi.mock("../../../hooks/useResendAttendeeEmail", () => ({
  useResendAttendeeEmail: () => ({ resend, isLoading: false }),
}));

describe("AttendeeMessages", () => {
  beforeEach(() => {
    markRead.mockReset();
    resend.mockReset();
  });

  it("omits the meet name from withdrawal audit entries", () => {
    render(
      <AttendeeAuditEntry
        log={{
          id: "withdrawal",
          timestamp: "2026-10-20T10:00:00Z",
          description: "Taylor withdrew application from meet Sunrise Hike",
        }}
      />,
    );

    expect(screen.getByText("Taylor withdrew application")).toBeInTheDocument();
    expect(
      screen.queryByText(/from meet Sunrise Hike/),
    ).not.toBeInTheDocument();
  });

  it("omits the meet wall target from audit entries", () => {
    render(
      <AttendeeAuditEntry
        log={{
          id: "wall-post",
          timestamp: "2026-10-20T10:00:00Z",
          description: "Taylor posted photo\u00a0to meet wall for Sunrise Hike",
        }}
      />,
    );

    expect(screen.getByText("Taylor posted photo")).toBeInTheDocument();
    expect(screen.queryByText(/meet wall for/)).not.toBeInTheDocument();
  });

  it("resends failed emails without expanding the message", () => {
    render(
      <AttendeeMessages
        meetId="meet-1"
        attendeeId="attendee-1"
        attendeeEmail="attendee@example.com"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Resend" }));

    expect(resend).toHaveBeenCalledWith({
      meetId: "meet-1",
      attendeeId: "attendee-1",
      messageId: "failed-message",
    });
    expect(
      screen.getByRole("button", { name: "Resend" }).closest("[aria-expanded]"),
    ).toHaveAttribute("aria-expanded", "false");
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

  it("interleaves grey italic audit entries between emails by time", () => {
    const { container } = render(
      <AttendeeMessages
        meetId="meet-1"
        attendeeId="attendee-1"
        attendeeEmail="attendee@example.com"
      />,
    );

    const content = container.textContent || "";
    expect(content.indexOf("Received")).toBeLessThan(
      content.indexOf("Taylor accepted application"),
    );
    expect(content.indexOf("Taylor accepted application")).toBeLessThan(
      content.indexOf("Sent"),
    );
    const auditText = screen.getByText("Taylor accepted application");
    expect(screen.queryByText(/for meet Sunrise Hike/)).not.toBeInTheDocument();
    expect(auditText).toHaveStyle({ fontStyle: "italic" });
    expect(auditText.closest(".MuiPaper-root")).toHaveStyle({
      backgroundColor: "#f5f5f5",
    });
    fireEvent.click(auditText);
    expect(markRead).not.toHaveBeenCalled();
  });
});
