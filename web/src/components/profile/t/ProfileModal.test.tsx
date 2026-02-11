import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import { ProfileModal } from "../ProfileModal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

let mockedOrganization: Record<string, any> = {
  id: "org-1",
  name: "Adventure Meets",
  isPrivate: false,
  canViewAllMeets: true,
};

vi.mock("../../../context/authContext", () => ({
  useAuth: () => ({
    user: {
      id: "user-1",
      firstName: "Alice",
      lastName: "Walker",
      email: "alice@example.com",
      phone: "+61412345678",
      emailVerified: true,
    },
  }),
}));

vi.mock("../../../context/organizationContext", () => ({
  useCurrentOrganization: () => ({
    currentOrganizationId: "org-1",
    currentOrganizationRole: "admin",
  }),
}));

vi.mock("../../../hooks/useUpdateUser", () => ({
  useUpdateUser: () => ({
    updateUserAsync: vi.fn(),
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../../hooks/useFetchOrganization", () => ({
  useFetchOrganization: () => ({
    data: mockedOrganization,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../../hooks/useUpdateOrganization", () => ({
  useUpdateOrganization: () => ({
    updateOrganizationAsync: vi.fn(),
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../../hooks/useFetchOrganizationMetaDefinitions", () => ({
  useFetchOrganizationMetaDefinitions: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../../hooks/useFetchUserMetaValues", () => ({
  useFetchUserMetaValues: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../../hooks/useUpdateUserMetaValues", () => ({
  useUpdateUserMetaValues: () => ({
    updateMetaValuesAsync: vi.fn(),
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../../hooks/useNotistack", () => ({
  useNotistack: () => ({
    success: vi.fn(),
  }),
}));

describe("ProfileModal", () => {
  const renderWithQueryClient = (ui: React.ReactElement) => {
    const queryClient = new QueryClient();
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    );
  };

  beforeEach(() => {
    mockedOrganization = {
      id: "org-1",
      name: "Adventure Meets",
      isPrivate: false,
      canViewAllMeets: true,
    };
  });

  it("renders and allows section navigation", () => {
    renderWithQueryClient(<ProfileModal open onClose={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: "Personal details" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Organisation" }));
    expect(screen.getByText("Save organization")).toBeInTheDocument();
    expect(
      screen.getByText("Allow members to see all events in this organisation"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Security" }));
    expect(screen.getByText("Update password")).toBeInTheDocument();
  });

  it("calls onClose when close is clicked", () => {
    const onClose = vi.fn();
    renderWithQueryClient(<ProfileModal open onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows invite toggle instead of invite link when organization is private", () => {
    mockedOrganization = {
      id: "org-1",
      name: "Adventure Meets",
      isPrivate: true,
    };

    renderWithQueryClient(<ProfileModal open onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Organisation" }));

    expect(
      screen.getByText("Allow users to join with invite link"),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Invite link")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Copy invite link" }),
    ).not.toBeInTheDocument();
  });
});
