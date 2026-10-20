import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { useFetchAttendeeMessages } from "../useFetchAttendeeMessages";

const get = vi.fn();

vi.mock("../useApi", () => ({
  useApi: () => ({ get }),
}));

it("returns attendee audit entries separately from messages", async () => {
  get.mockResolvedValue({
    messages: [{ id: "message-1", content: "Subject: Hello\n\nHi" }],
    auditLogs: [
      {
        id: "audit-1",
        timestamp: "2026-10-20T10:00:00Z",
        description: "Taylor accepted application",
      },
    ],
  });
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const { result } = renderHook(
    () => useFetchAttendeeMessages("meet-1", "attendee-1"),
    { wrapper },
  );

  await waitFor(() => {
    expect(result.current.data).toHaveLength(1);
    expect(result.current.auditLogs).toEqual([
      {
        id: "audit-1",
        timestamp: "2026-10-20T10:00:00Z",
        description: "Taylor accepted application",
      },
    ]);
  });
  expect(get).toHaveBeenCalledWith(
    "/meets/meet-1/attendees/attendee-1/messages",
  );
});
