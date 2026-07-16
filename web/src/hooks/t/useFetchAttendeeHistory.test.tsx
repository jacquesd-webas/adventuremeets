import { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFetchAttendeeHistory } from "../useFetchAttendeeHistory";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useFetchAttendeeHistory", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("refetches attendee history when the attendee id changes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            history: [
              {
                meetId: "meet-2",
                date: "2026-03-20T08:00:00.000Z",
                meetName: "Cliff Walk",
                attendeeStatus: "confirmed",
              },
            ],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            history: [
              {
                meetId: "meet-3",
                date: "2026-02-01T09:00:00.000Z",
                meetName: "Trail Run",
                attendeeStatus: "waitlisted",
              },
            ],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );

    vi.stubGlobal("fetch", fetchMock);

    const { result, rerender } = renderHook(
      ({ attendeeId, meetId }) => useFetchAttendeeHistory(attendeeId, meetId),
      {
        initialProps: { attendeeId: "attendee-1", meetId: "meet-1" },
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.data).toEqual([
        {
          meetId: "meet-2",
          date: "2026-03-20T08:00:00.000Z",
          meetName: "Cliff Walk",
          attendeeStatus: "confirmed",
        },
      ]);
    });

    rerender({ attendeeId: "attendee-2", meetId: "meet-1" });

    await waitFor(() => {
      expect(result.current.data).toEqual([
        {
          meetId: "meet-3",
          date: "2026-02-01T09:00:00.000Z",
          meetName: "Trail Run",
          attendeeStatus: "waitlisted",
        },
      ]);
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://localhost:8000/api/v1/meets/meet-1/attendees/attendee-1/history",
    );
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "http://localhost:8000/api/v1/meets/meet-1/attendees/attendee-2/history",
    );
  });
});
