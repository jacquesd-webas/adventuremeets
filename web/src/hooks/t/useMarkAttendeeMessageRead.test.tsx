import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMarkAttendeeMessageRead } from "../useMarkAttendeeMessageRead";

const patch = vi.fn();

vi.mock("../useApi", () => ({
  useApi: () => ({ patch }),
}));

describe("useMarkAttendeeMessageRead", () => {
  beforeEach(() => {
    patch.mockReset();
  });

  it("immediately clears the message and attendee unread state", async () => {
    patch.mockResolvedValueOnce({});
    const queryClient = new QueryClient();
    queryClient.setQueryData(
      ["attendee-messages", "meet-1", "attendee-1"],
      [{ id: "message-1", isRead: false, direction: "received" }],
    );
    queryClient.setQueryData(["meet-attendees", "meet-1", "all"], {
      attendees: [{ id: "attendee-1", hasUnreadMessages: true }],
      source: "network",
    });
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useMarkAttendeeMessageRead(), {
      wrapper,
    });

    await result.current.markReadAsync({
      meetId: "meet-1",
      attendeeId: "attendee-1",
      messageId: "message-1",
    });

    expect(patch).toHaveBeenCalledWith(
      "/meets/meet-1/messages/message-1/read",
      {},
    );
    expect(
      queryClient.getQueryData<any[]>([
        "attendee-messages",
        "meet-1",
        "attendee-1",
      ]),
    ).toEqual([expect.objectContaining({ id: "message-1", isRead: true })]);
    expect(
      queryClient.getQueryData<any>(["meet-attendees", "meet-1", "all"])
        .attendees,
    ).toEqual([
      expect.objectContaining({
        id: "attendee-1",
        hasUnreadMessages: false,
      }),
    ]);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["attendee-messages", "meet-1", "attendee-1"],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["meet-attendees", "meet-1"],
    });
  });

  it("keeps the attendee unread while another unread message remains", async () => {
    patch.mockResolvedValueOnce({});
    const queryClient = new QueryClient();
    queryClient.setQueryData(
      ["attendee-messages", "meet-1", "attendee-1"],
      [
        { id: "message-1", isRead: false },
        { id: "message-2", isRead: false },
      ],
    );
    queryClient.setQueryData(["meet-attendees", "meet-1", "all"], {
      attendees: [{ id: "attendee-1", hasUnreadMessages: true }],
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useMarkAttendeeMessageRead(), {
      wrapper,
    });

    await result.current.markReadAsync({
      meetId: "meet-1",
      attendeeId: "attendee-1",
      messageId: "message-1",
    });

    expect(
      queryClient.getQueryData<any>(["meet-attendees", "meet-1", "all"])
        .attendees[0].hasUnreadMessages,
    ).toBe(true);
  });

  it("restores unread state when marking the message fails", async () => {
    patch.mockRejectedValueOnce(new Error("Request failed"));
    const queryClient = new QueryClient();
    queryClient.setQueryData(
      ["attendee-messages", "meet-1", "attendee-1"],
      [{ id: "message-1", isRead: false }],
    );
    queryClient.setQueryData(["meet-attendees", "meet-1", "all"], {
      attendees: [{ id: "attendee-1", hasUnreadMessages: true }],
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useMarkAttendeeMessageRead(), {
      wrapper,
    });

    await expect(
      result.current.markReadAsync({
        meetId: "meet-1",
        attendeeId: "attendee-1",
        messageId: "message-1",
      }),
    ).rejects.toThrow("Request failed");

    expect(
      queryClient.getQueryData<any[]>([
        "attendee-messages",
        "meet-1",
        "attendee-1",
      ])[0].isRead,
    ).toBe(false);
    expect(
      queryClient.getQueryData<any>(["meet-attendees", "meet-1", "all"])
        .attendees[0].hasUnreadMessages,
    ).toBe(true);
  });
});
