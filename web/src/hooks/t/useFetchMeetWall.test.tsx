import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFetchMeetWall } from "../useFetchMeetWall";

const get = vi.fn();
let meUpdatedAt = 1;

vi.mock("../useApi", () => ({
  useApi: () => ({
    get,
  }),
}));

vi.mock("../../context/authContext", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
    isLoading: false,
    isAuthenticated: true,
    meUpdatedAt,
    refreshSession: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe("useFetchMeetWall", () => {
  beforeEach(() => {
    get.mockReset();
    meUpdatedAt = 1;
  });

  it("refetches the wall after the authenticated session updates", async () => {
    get
      .mockRejectedValueOnce(new Error("Unauthorized"))
      .mockResolvedValueOnce({
        wallItems: [{ id: "wall-1", meetId: "meet-1", favourite: 0 }],
      });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result, rerender } = renderHook(() => useFetchMeetWall("meet-1"), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Unauthorized");
    });

    meUpdatedAt = 2;
    rerender();

    await waitFor(() => {
      expect(get).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.data).toEqual([
        expect.objectContaining({ id: "wall-1", meetId: "meet-1" }),
      ]);
    });
  });

  it("does not tie attendee wall links to auth session refreshes", async () => {
    get.mockResolvedValue({ wallItems: [] });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { rerender } = renderHook(
      () => useFetchMeetWall("meet-1", "attendee-1"),
      { wrapper },
    );

    await waitFor(() => {
      expect(get).toHaveBeenCalledTimes(1);
    });

    meUpdatedAt = 2;
    rerender();

    await waitFor(() => {
      expect(get).toHaveBeenCalledTimes(1);
    });
  });
});
