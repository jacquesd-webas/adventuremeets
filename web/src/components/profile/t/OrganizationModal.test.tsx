import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
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
      customField1HelperText: "Your walking club",
      customField2HelperText: "Your local region",
      userCount: 12,
      meetCountLast30Days: 2,
      attendanceCountLast30Days: 10,
      meetCountLast90Days: 4,
      attendanceCountLast90Days: 28,
      meetCountTotal: 19,
      attendanceCountTotal: 95,
      adminCount: 2,
      organizerCount: 3,
      memberCount: 7,
      meetImageBytes: 1024,
      wallImageBytes: 2048,
      totalImageBytes: 3072,
      reportingEnabled: true,
      brandingEnabled: false,
      domainEnabled: true,
      whatsappEnabled: false,
      paymentsEnabled: true,
      diskQuotasEnabled: false,
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
    expect(screen.getByRole("button", { name: "Fields" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Privacy" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stats" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Features" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Choose file" }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(
      screen.getByText(
        "This feature has not been enabled for this organisation.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Fields" }));

    expect(screen.getByDisplayValue("Club")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Region")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Your walking club")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Your local region")).toBeInTheDocument();

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

    fireEvent.click(screen.getByRole("button", { name: "Stats" }));

    expect(screen.getByText("Meets")).toBeInTheDocument();
    const thirtyDayCard = screen.getByText("30 days").closest(".MuiPaper-root");
    const ninetyDayCard = screen.getByText("90 days").closest(".MuiPaper-root");
    const totalCard = screen.getByText("Total").closest(".MuiPaper-root");

    expect(thirtyDayCard).not.toBeNull();
    expect(ninetyDayCard).not.toBeNull();
    expect(totalCard).not.toBeNull();

    expect(within(thirtyDayCard!).getByText("30 days")).toBeInTheDocument();
    expect(within(thirtyDayCard!).getByText("2")).toBeInTheDocument();

    expect(within(ninetyDayCard!).getByText("90 days")).toBeInTheDocument();
    expect(within(ninetyDayCard!).getByText("4")).toBeInTheDocument();

    expect(within(totalCard!).getByText("Total")).toBeInTheDocument();
    expect(within(totalCard!).getByText("19")).toBeInTheDocument();

    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Admins")).toBeInTheDocument();
    expect(screen.getByText("Organisers")).toBeInTheDocument();
    expect(screen.getByText("Members")).toBeInTheDocument();
    expect(screen.getByText("Resources")).toBeInTheDocument();
    expect(screen.getByText("Meet images")).toBeInTheDocument();
    expect(screen.getByText("Wall images")).toBeInTheDocument();
    expect(screen.getByText("1 KB")).toBeInTheDocument();
    expect(screen.getByText("2 KB")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Features" }));

    expect(
      screen.getByRole("checkbox", { name: "Advanced reporting" }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Branded communications" }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Custom domains" }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "WhatsApp integration" }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Payment Gateway" }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Storage options" }),
    ).not.toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(
      screen.getByText("Organisations can be created under your user profile."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Go to Profile" }),
    ).toBeInTheDocument();
  });

  it("saves custom field names", async () => {
    mockedUpdateOrganizationAsync.mockResolvedValue({
      ...mockedOrganization,
      customField1Name: "Membership number",
      customField2Name: "Branch",
      customField1HelperText: "Found on your club card",
      customField2HelperText: "Home branch",
    });

    await renderWithQueryClient(<OrganizationModal open onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Fields" }));
    fireEvent.change(screen.getByLabelText("Custom field 1 name"), {
      target: { value: "Membership number" },
    });
    fireEvent.change(screen.getByLabelText("Custom field 2 name"), {
      target: { value: "Branch" },
    });
    fireEvent.change(screen.getByLabelText("Custom field 1 preview text"), {
      target: { value: "Found on your club card" },
    });
    fireEvent.change(screen.getByLabelText("Custom field 2 preview text"), {
      target: { value: "Home branch" },
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
        customField1HelperText: "Found on your club card",
        customField2HelperText: "Home branch",
      }),
    );
  });

  it("shows organisation feature flags as read-only", async () => {
    await renderWithQueryClient(<OrganizationModal open onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Features" }));

    expect(
      screen.getByRole("checkbox", { name: "Advanced reporting" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("checkbox", { name: "Branded communications" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("checkbox", { name: "Custom domains" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("checkbox", { name: "WhatsApp integration" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("checkbox", { name: "Payment Gateway" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("checkbox", { name: "Storage options" }),
    ).toBeDisabled();
    expect(mockedUpdateOrganizationAsync).not.toHaveBeenCalled();
  });

  it("shows read-only feature flags on mobile", async () => {
    setMatchMedia(true);

    await renderWithQueryClient(<OrganizationModal open onClose={vi.fn()} />);

    expect(
      screen.getByRole("checkbox", { name: "Advanced reporting" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("checkbox", { name: "Storage options" }),
    ).toBeDisabled();
    expect(mockedUpdateOrganizationAsync).not.toHaveBeenCalled();
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
    expect(screen.getByText("Stats")).toBeInTheDocument();
    expect(screen.getByText("Features")).toBeInTheDocument();
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
    expect(
      screen.queryByRole("button", { name: "Stats" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Features" }),
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
    expect(screen.getByRole("button", { name: "Stats" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Features" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });
});
