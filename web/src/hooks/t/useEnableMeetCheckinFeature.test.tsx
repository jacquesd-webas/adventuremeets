import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { useEnableMeetCheckinFeature } from "../useEnableMeetCheckinFeature";

const patch = vi.fn();

vi.mock("../useApi", () => ({
  useApi: () => ({ patch }),
}));

describe("useEnableMeetCheckinFeature", () => {
  it.each([
    ["walkins", { allowSelfCheckin: true, allowWalkins: true }],
    ["self-checkin", { allowSelfCheckin: true }],
  ] as const)("enables %s and refreshes the meet", async (feature, updates) => {
    patch.mockResolvedValueOnce({ id: "meet-1" });
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useEnableMeetCheckinFeature("meet-1"), {
      wrapper,
    });

    await result.current.mutateAsync(feature);

    expect(patch).toHaveBeenCalledWith("/meets/meet-1", updates);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["meet", "meet-1"],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["meets"] });
  });
});
