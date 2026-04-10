import { act, fireEvent, render, screen } from "@testing-library/react";
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
let mockedInvites: Array<Record<string, any>> = [];
const mockedUpdateMetaValuesAsync = vi.fn();
const mockedCreateInviteAsync = vi.fn();

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

vi.mock("../../../hooks/useCreateOrganizationInvite", () => ({
  useCreateOrganizationInvite: () => ({
    createInviteAsync: mockedCreateInviteAsync,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../../hooks/useOrganizationRoleOptions", () => ({
  useOrganizationRoleOptions: () => ({
    roleOptions: [
      { id: 2, name: "admin", label: "Admin" },
      { id: 3, name: "organizer", label: "Organizer" },
      { id: 4, name: "member", label: "Member" },
    ],
    defaultRoleId: 4,
  }),
}));

vi.mock("../../../hooks/useFetchOrganizationInvites", () => ({
  useFetchOrganizationInvites: () => ({
    data: mockedInvites,
    isLoading: false,
    error: null,
  }),
}));

describe("ProfileModal", () => {
  const renderWithQueryClient = async (ui: React.ReactElement) => {
    const queryClient = new QueryClient();
    let result: ReturnType<typeof render> | undefined;
    await act(async () => {
      result = render(
        <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
      );
    });
    return result!;
  };

  beforeEach(() => {
    mockedUpdateMetaValuesAsync.mockReset();
    mockedCreateInviteAsync.mockReset();
    mockedOrganization = {
      id: "org-1",
      name: "Adventure Meets",
      isPrivate: false,
      canViewAllMeets: true,
    };
    mockedMetaDefinitions = [];
    mockedUserMetaValues = [];
    mockedInvites = [];
  });

  it("renders and allows section navigation", async () => {
    await renderWithQueryClient(<ProfileModal open onClose={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: "Personal details" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Organisation" }));
    expect(
      screen.getByText("Allow regular users to join with invite link"),
    ).toBeInTheDocument();
    expect(screen.getByText("Save organization")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Invites" }));
    expect(
      screen.getByRole("button", { name: "Invite User" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Pending invites")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Security" }));
    expect(screen.getByText("Update password")).toBeInTheDocument();
  });

  it("calls onClose when close is clicked", async () => {
    const onClose = vi.fn();
    await renderWithQueryClient(<ProfileModal open onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("hides organisation invite link textbox when organization is private", async () => {
    mockedOrganization = {
      id: "org-1",
      name: "Adventure Meets",
      isPrivate: true,
    };

    await renderWithQueryClient(<ProfileModal open onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Organisation" }));

    expect(
      screen.getByText("Allow regular users to join with invite link"),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Invite link")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Copy invite link" }),
    ).not.toBeInTheDocument();
  });

  it("shows a copy action per pending invite", async () => {
    mockedInvites = [
      {
        id: "invite-1",
        organizationId: "org-1",
        email: "invitee@example.com",
        token: "ABC123DEF456",
        roleId: 4,
        acceptedAt: null,
      },
    ];

    await renderWithQueryClient(<ProfileModal open onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Invites" }));

    expect(
      screen.getByRole("button", {
        name: "Copy invite link for invitee@example.com",
      }),
    ).toBeInTheDocument();
  });

  it("sends empty values for omitted autofill fields", async () => {
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

    await renderWithQueryClient(<ProfileModal open onClose={vi.fn()} />);
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
