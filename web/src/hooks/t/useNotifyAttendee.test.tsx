import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { useNotifyAttendee } from "../useNotifyAttendee";

const post = vi.fn();

vi.mock("../useApi", () => ({
  useApi: () => ({
    post,
  }),
}));

vi.mock("../useNotistack", () => ({
  useNotistack: () => ({
    error: vi.fn(),
  }),
}));

describe("useNotifyAttendee", () => {
  it.each([false, true])("invalidates message queries after a send attempt (failure=%s)", async (fails) => {
    if (fails) post.mockRejectedValueOnce(new Error("SMTP rejected"));
    else post.mockResolvedValueOnce({ ok: true });

    const queryClient = new QueryClient();
    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useNotifyAttendee(), { wrapper });

    const send = result.current.notifyAttendeeAsync({
      meetId: "meet-1",
      subject: "Hello",
      text: "Body",
      attendeeIds: ["attendee-1"],
    });
    if (fails) await expect(send).rejects.toThrow("SMTP rejected");
    else await send;

    expect(post).toHaveBeenCalledWith("/meets/meet-1/message", {
      subject: "Hello",
      text: "Body",
      attendeeIds: ["attendee-1"],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["meet-attendees", "meet-1"],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["attendee-messages", "meet-1"],
    });
  });
});
