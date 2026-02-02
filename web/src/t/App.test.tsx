import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import App from "../App";
import { ThemeModeProvider } from "../context/ThemeModeContext";
import { NotistackProvider } from "../components/NotistackProvider";

vi.mock("../hooks/useFetchMeets", () => ({
  useFetchMeets: () => ({ data: [], isLoading: false, refetch: vi.fn() })
}));

vi.mock("../hooks/useFetchMeetStatuses", () => ({
  useMeetStatusLookup: () => ({ getName: () => "Status" })
}));

vi.mock("../hooks/useUpdateMeetStatus", () => ({
  useUpdateMeetStatus: () => ({ updateStatusAsync: vi.fn(), isLoading: false })
}));

vi.mock("../hooks/useApi", () => ({
  useApi: () => ({
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    del: vi.fn()
  })
}));

describe("App", () => {
  it("renders next steps", () => {
    const queryClient = new QueryClient();
    render(
      <ThemeModeProvider>
        <QueryClientProvider client={queryClient}>
          <NotistackProvider>
            <MemoryRouter>
              <App />
            </MemoryRouter>
          </NotistackProvider>
        </QueryClientProvider>
      </ThemeModeProvider>
    );
    expect(screen.getAllByText(/Dashboard/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Upcoming Meets/i).length).toBeGreaterThan(0);
  });
});
