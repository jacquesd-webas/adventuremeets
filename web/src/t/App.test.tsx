import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import App from "../App";
import { ThemeModeProvider } from "../context/ThemeModeContext";
import { NotistackProvider } from "../components/NotistackProvider";
import { AuthContext } from "../context/authContext";
import { OrganizationContext } from "../context/organizationContext";
import { FilterContext } from "../context/filterContext";

vi.mock("../hooks/useFetchMeets", () => ({
  useFetchMeets: () => ({ data: [], isLoading: false, refetch: vi.fn() }),
}));

vi.mock("../hooks/useFetchMeetStatuses", () => ({
  useMeetStatusLookup: () => ({ getName: () => "Status" }),
}));

vi.mock("../hooks/useUpdateMeetStatus", () => ({
  useUpdateMeetStatus: () => ({ updateStatusAsync: vi.fn(), isLoading: false }),
}));

vi.mock("../hooks/useApi", () => ({
  useApi: () => ({
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    del: vi.fn(),
  }),
}));

describe("App", () => {
  it("redirects unauthenticated users to login", () => {
    const queryClient = new QueryClient();
    render(
      <ThemeModeProvider>
        <QueryClientProvider client={queryClient}>
          <NotistackProvider>
            <AuthContext.Provider
              value={{
                user: undefined,
                isLoading: false,
                isAuthenticated: false,
                meUpdatedAt: 0,
                refreshSession: vi.fn(),
                logout: vi.fn(),
              }}
            >
              <OrganizationContext.Provider
                value={{
                  organizationIds: [],
                  currentOrganizationId: null,
                  currentOrganizationName: null,
                  currentOrganizationRole: null,
                  setCurrentOrganizationId: vi.fn(),
                }}
              >
                <FilterContext.Provider
                  value={{
                    dashboardView: "all",
                    listPageView: "upcoming",
                    setDashboardView: vi.fn(),
                    setListPageView: vi.fn(),
                  }}
                >
                  <MemoryRouter
                    initialEntries={["/"]}
                    future={{
                      v7_startTransition: true,
                      v7_relativeSplatPath: true,
                    }}
                  >
                    <App />
                  </MemoryRouter>
                </FilterContext.Provider>
              </OrganizationContext.Provider>
            </AuthContext.Provider>
          </NotistackProvider>
        </QueryClientProvider>
      </ThemeModeProvider>,
    );
    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
  });
});
