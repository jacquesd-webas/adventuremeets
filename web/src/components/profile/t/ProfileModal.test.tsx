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
let mockedMetaDefinitions: Array<Record<string, any>> = [];
let mockedUserMetaValues: Array<Record<string, any>> = [];
const mockedUpdateMetaValuesAsync = vi.fn();

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
    data: mockedMetaDefinitions,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../../hooks/useFetchUserMetaValues", () => ({
  useFetchUserMetaValues: () => ({
    data: mockedUserMetaValues,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../../hooks/useUpdateUserMetaValues", () => ({
  useUpdateUserMetaValues: () => ({
    updateMetaValuesAsync: mockedUpdateMetaValuesAsync,
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
    mockedUpdateMetaValuesAsync.mockReset();
    mockedOrganization = {
      id: "org-1",
      name: "Adventure Meets",
      isPrivate: false,
      canViewAllMeets: true,
    };
    mockedMetaDefinitions = [];
    mockedUserMetaValues = [];
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

  it("sends empty values for omitted autofill fields", () => {
    mockedMetaDefinitions = [
      {
        fieldKey: "name",
        label: "Name",
        fieldType: "text",
      },
    ];
    mockedUserMetaValues = [
      { key: "name", value: "Alice" },
      { key: "dietary", value: "Vegan" },
    ];

    renderWithQueryClient(<ProfileModal open onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "AutoFill" }));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Alice Updated" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save AutoFill" }));

    expect(mockedUpdateMetaValuesAsync).toHaveBeenCalledWith({
      userId: "user-1",
      organizationId: "org-1",
      values: [
        { key: "name", value: "Alice Updated" },
        { key: "dietary", value: null },
      ],
    });
  });
});
