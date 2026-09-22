import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import MainLayout from "./MainLayout";
import { ThemeModeProvider } from "../context/ThemeModeContext";
import { NotistackProvider } from "../components/NotistackProvider";
import { AuthContext } from "../context/authContext";
import { OrganizationContext } from "../context/organizationContext";

const setMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

vi.mock("../hooks/useFetchOrganization", () => ({
  useFetchOrganization: () => ({
    data: {
      id: "org-1",
      name: "Adventure Meets",
      theme: null,
    },
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../components/auth/ChooseOrganizationModal", () => ({
  ChooseOrganizationModal: () => null,
}));

vi.mock("../components/auth/PendingInvitePromptModal", () => ({
  PendingInvitePromptModal: () => null,
}));

describe("MainLayout", () => {
  const renderLayout = ({
    userOrganizations = { "org-1": "admin" },
    currentOrganizationRole = "admin",
  }: {
    userOrganizations?: Record<string, string>;
    currentOrganizationRole?: string;
  } = {}) => {
    const queryClient = new QueryClient();

    return render(
      <ThemeModeProvider>
        <QueryClientProvider client={queryClient}>
          <NotistackProvider>
            <AuthContext.Provider
              value={{
                user: {
                  id: "user-1",
                  firstName: "Alice",
                  lastName: "Walker",
                  email: "alice@example.com",
                  organizations: userOrganizations,
                  pendingInvites: [],
                } as any,
                isLoading: false,
                isAuthenticated: true,
                meUpdatedAt: 0,
                refreshSession: vi.fn(),
                logout: vi.fn(),
              }}
            >
              <OrganizationContext.Provider
                value={{
                  organizationIds: ["org-1"],
                  currentOrganizationId: "org-1",
                  currentOrganizationName: "Adventure Meets",
                  currentOrganizationRole,
                  setCurrentOrganizationId: vi.fn(),
                }}
              >
                <MemoryRouter
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                  }}
                >
                  <MainLayout />
                </MemoryRouter>
              </OrganizationContext.Provider>
            </AuthContext.Provider>
          </NotistackProvider>
        </QueryClientProvider>
      </ThemeModeProvider>,
    );
  };

  it("opens the organisation modal from the desktop account menu", () => {
    setMatchMedia(false);
    renderLayout();

    fireEvent.click(screen.getByLabelText("Open account menu"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Organisation" }));

    expect(screen.getByTestId("organization-modal")).toBeInTheDocument();
  });

  it("opens the organisation drawer from the mobile account section", () => {
    setMatchMedia(true);
    renderLayout();

    fireEvent.click(screen.getByLabelText("Open navigation"));
    fireEvent.click(screen.getByRole("button", { name: "Organisation" }));

    expect(screen.getByTestId("organization-drawer")).toBeInTheDocument();
  });

  it("does not show the organisation menu item for non-admin users on desktop", () => {
    setMatchMedia(false);
    renderLayout({
      userOrganizations: { "org-1": "member" },
      currentOrganizationRole: "member",
    });

    fireEvent.click(screen.getByLabelText("Open account menu"));

    expect(
      screen.queryByRole("menuitem", { name: "Organisation" }),
    ).not.toBeInTheDocument();
  });

  it("does not show the organisation menu item for non-admin users on mobile", () => {
    setMatchMedia(true);
    renderLayout({
      userOrganizations: { "org-1": "member" },
      currentOrganizationRole: "member",
    });

    fireEvent.click(screen.getByLabelText("Open navigation"));

    expect(
      screen.queryByRole("button", { name: "Organisation" }),
    ).not.toBeInTheDocument();
  });
});
