import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useFetchPreviousMeetAnswers } from "../useFetchPreviousMeetAnswers";

const apiGet = vi.hoisted(() => vi.fn());

vi.mock("../useApi", () => ({
  useApi: () => ({ get: apiGet }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

beforeEach(() => apiGet.mockReset());

it("does not request earlier answers without a signed-in user", () => {
  renderHook(() => useFetchPreviousMeetAnswers("meet-1"), {
    wrapper: createWrapper(),
  });

  expect(apiGet).not.toHaveBeenCalled();
});

it("loads the signed-in user's earlier answers for the meet", async () => {
  apiGet.mockResolvedValue({ metaValues: { dietary: "Vegan" } });
  const { result } = renderHook(
    () => useFetchPreviousMeetAnswers("meet-1", "user-1"),
    { wrapper: createWrapper() },
  );

  await waitFor(() =>
    expect(result.current.data).toEqual({ dietary: "Vegan" }),
  );
  expect(apiGet).toHaveBeenCalledWith(
    "/meets/meet-1/my-previous-answers?isMinor=false",
  );
});

it("loads minor answers separately from adult answers", async () => {
  apiGet.mockImplementation((url: string) =>
    Promise.resolve({
      metaValues: {
        dietary: url?.endsWith("true") ? "Child answer" : "Adult answer",
      },
    }),
  );
  const wrapper = createWrapper();
  const { result, rerender } = renderHook(
    ({ isMinor }) => useFetchPreviousMeetAnswers("meet-1", "user-1", isMinor),
    { wrapper, initialProps: { isMinor: false } },
  );

  await waitFor(() => expect(result.current.data.dietary).toBe("Adult answer"));
  rerender({ isMinor: true });
  await waitFor(() => expect(result.current.data.dietary).toBe("Child answer"));
  expect(apiGet).toHaveBeenCalledWith(
    "/meets/meet-1/my-previous-answers?isMinor=true",
  );
});
