import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { useFetchMeetSignup } from "../useFetchMeetSignup";

const get = vi.fn();

vi.mock("../useApi", () => ({
  useApi: () => ({ get }),
}));

it("includes the PDF indemnity template flag in signup meet data", async () => {
  get.mockResolvedValue({
    id: "meet-1",
    name: "Mountain Hike",
    hasIndemnity: true,
    hasPdfIndemnityTemplate: true,
    metaDefinitions: [
      { id: "meta-1", fieldKey: "travel", label: "Travel", category: "T" },
      { id: "meta-2", fieldKey: "notes", label: "Notes", category: "F" },
    ],
  });
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const { result } = renderHook(() => useFetchMeetSignup("share-123"), {
    wrapper,
  });

  await waitFor(() => {
    expect(result.current.data?.hasPdfIndemnityTemplate).toBe(true);
    expect(
      result.current.data?.metaDefinitions?.map((field) => field.category),
    ).toEqual(["T", "N"]);
  });
  expect(get).toHaveBeenCalledWith("/meets/share-123");
});
