import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import { OrganizationModal } from "../OrganizationModal";

let mockedOrganization: Record<string, any> = {
  id: "org-1",
  name: "Adventure Meets",
  isPrivate: false,
  canViewAllMeets: true,
};
let mockedInvites: Array<Record<string, any>> = [];
let mockedCurrentOrganizationRole = "admin";
const mockedCreateInviteAsync = vi.fn();
const mockedUpdateOrganizationAsync = vi.fn();

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

vi.mock("../../../context/organizationContext", () => ({
  useCurrentOrganization: () => ({
    currentOrganizationId: "org-1",
    currentOrganizationRole: mockedCurrentOrganizationRole,
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
    updateOrganizationAsync: mockedUpdateOrganizationAsync,
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
      { id: 3, name: "organizer", label: "Organiser" },
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

describe("OrganizationModal", () => {
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
    setMatchMedia(false);
    mockedCreateInviteAsync.mockReset();
    mockedUpdateOrganizationAsync.mockReset();
    mockedOrganization = {
      id: "org-1",
      name: "Adventure Meets",
      isPrivate: false,
      canViewAllMeets: true,
      customField1Name: "Club",
      customField2Name: "Region",
    };
    mockedInvites = [];
    mockedCurrentOrganizationRole = "admin";
  });

  it("renders and allows section navigation", async () => {
    await renderWithQueryClient(<OrganizationModal open onClose={vi.fn()} />);

    expect(screen.getByTestId("organization-modal")).toBeInTheDocument();
    expect(
      screen.getByText("Update your organisation name and look and feel."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Theme" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fields" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Privacy" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Choose file" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(
      screen.getByText("Organisations can be created under your user profile."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Go to Profile" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Fields" }));

    expect(screen.getByDisplayValue("Club")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Region")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Privacy" }));

    expect(
      screen.getByText("Allow regular users to join with invite link"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save privacy settings" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Invites" }));

    expect(
      screen.getByRole("button", { name: "Invite User" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Invite specific users to join your organisation."),
    ).toBeInTheDocument();
  });

  it("saves custom field names", async () => {
    mockedUpdateOrganizationAsync.mockResolvedValue({
      ...mockedOrganization,
      customField1Name: "Membership number",
      customField2Name: "Branch",
    });

    await renderWithQueryClient(<OrganizationModal open onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Fields" }));
    fireEvent.change(screen.getByLabelText("Custom field 1 name"), {
      target: { value: "Membership number" },
    });
    fireEvent.change(screen.getByLabelText("Custom field 2 name"), {
      target: { value: "Branch" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save field names" }));

    await waitFor(() =>
      expect(mockedUpdateOrganizationAsync).toHaveBeenCalledWith({
        id: "org-1",
        name: "Adventure Meets",
        theme: undefined,
        isPrivate: false,
        canViewAllMeets: true,
        customField1Name: "Membership number",
        customField2Name: "Branch",
      }),
    );
  });

  it("renders all organisation sections stacked on mobile", async () => {
    setMatchMedia(true);

    await renderWithQueryClient(<OrganizationModal open onClose={vi.fn()} />);

    expect(screen.getByTestId("organization-modal")).toBeInTheDocument();
    expect(
      screen.getByText("Update your organisation name and look and feel."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Go to Profile" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Allow regular users to join with invite link"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Custom field 1 name")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Invite User" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Fields" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Privacy" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Invites" }),
    ).not.toBeInTheDocument();
  });

  it("calls onClose when close is clicked", async () => {
    const onClose = vi.fn();
    await renderWithQueryClient(<OrganizationModal open onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls back to open profile from the create section", async () => {
    const onOpenProfile = vi.fn();

    await renderWithQueryClient(
      <OrganizationModal
        open
        onClose={vi.fn()}
        onOpenProfile={onOpenProfile}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    fireEvent.click(screen.getByRole("button", { name: "Go to Profile" }));

    expect(onOpenProfile).toHaveBeenCalledTimes(1);
  });

  it("hides the invites section for non-admin users", async () => {
    mockedCurrentOrganizationRole = "organizer";

    await renderWithQueryClient(<OrganizationModal open onClose={vi.fn()} />);

    expect(
      screen.queryByRole("button", { name: "Invites" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Invite User" }),
    ).not.toBeInTheDocument();
  });
});
