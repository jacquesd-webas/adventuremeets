import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
let mockedIceInfo: Record<string, any> | null = null;
let mockedCurrentOrganizationRole = "admin";
const mockedUpdateMetaValuesAsync = vi.fn();
const mockedCreateInviteAsync = vi.fn();
const mockedUpdateMyIceInfoAsync = vi.fn();
const mockedUploadMyAvatarAsync = vi.fn();

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

vi.mock("../../../context/authContext", () => ({
  useAuth: () => ({
    user: {
      id: "user-1",
      firstName: "Alice",
      lastName: "Walker",
      email: "alice@example.com",
      phone: "+61412345678",
      emailVerified: true,
      avatarUrl: "https://cdn.example.com/existing-avatar.jpg",
    },
  }),
}));

vi.mock("../../../context/organizationContext", () => ({
  useCurrentOrganization: () => ({
    currentOrganizationId: "org-1",
    currentOrganizationRole: mockedCurrentOrganizationRole,
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

vi.mock("../../../hooks/useFetchMyIceInfo", () => ({
  useFetchMyIceInfo: () => ({
    data: mockedIceInfo,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../../hooks/useUpdateMyIceInfo", () => ({
  useUpdateMyIceInfo: () => ({
    updateMyIceInfoAsync: mockedUpdateMyIceInfoAsync,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../../hooks/useUploadMyAvatar", () => ({
  useUploadMyAvatar: () => ({
    uploadMyAvatarAsync: mockedUploadMyAvatarAsync,
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
    setMatchMedia(false);
    mockedUpdateMetaValuesAsync.mockReset();
    mockedCreateInviteAsync.mockReset();
    mockedUpdateMyIceInfoAsync.mockReset();
    mockedUploadMyAvatarAsync.mockReset();
    mockedOrganization = {
      id: "org-1",
      name: "Adventure Meets",
      isPrivate: false,
      canViewAllMeets: true,
    };
    mockedMetaDefinitions = [];
    mockedUserMetaValues = [];
    mockedInvites = [];
    mockedIceInfo = null;
    mockedCurrentOrganizationRole = "admin";
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
    expect(
      screen.getByText("Invite users to join your organisation."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Security" }));
    expect(screen.getByText("Update password")).toBeInTheDocument();
  });

  it("renders all profile sections stacked on mobile", async () => {
    setMatchMedia(true);

    await renderWithQueryClient(<ProfileModal open onClose={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: "Personal details" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Allow regular users to join with invite link"),
    ).toBeInTheDocument();
    expect(screen.getByText("Update password")).toBeInTheDocument();
    expect(screen.getByText("Save AutoFill")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save emergency info" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose file" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Invite User" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Organisation" }),
    ).not.toBeInTheDocument();
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

  it("hides the invite link textbox in invites when organization is private", async () => {
    mockedOrganization = {
      id: "org-1",
      name: "Adventure Meets",
      isPrivate: true,
    };

    await renderWithQueryClient(<ProfileModal open onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Invites" }));

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

  it("hides the invites section for non-admin users", async () => {
    mockedCurrentOrganizationRole = "organizer";

    await renderWithQueryClient(<ProfileModal open onClose={vi.fn()} />);

    expect(
      screen.queryByRole("button", { name: "Invites" }),
    ).not.toBeInTheDocument();
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

    await waitFor(() =>
      expect(mockedUpdateMetaValuesAsync).toHaveBeenCalledWith({
        userId: "user-1",
        organizationId: "org-1",
        values: [
          { key: "name", value: "Alice Updated" },
          { key: "dietary", value: null },
        ],
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Saved" }),
      ).toBeInTheDocument();
    });
  });

  it("saves emergency info through the dedicated ICE endpoint", async () => {
    mockedIceInfo = {
      iceName: "Existing Contact",
      icePhone: "+61412345678",
      iceMedicalAid: "Discovery",
      iceMedicalAidNumber: "MA-1",
      iceMedicalHistory: "Asthma",
      iceDob: "1990-04-12T00:00:00.000Z",
    };

    await renderWithQueryClient(<ProfileModal open onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Emergency Info" }));
    fireEvent.change(screen.getByLabelText("Medical history"), {
      target: { value: "Asthma and peanut allergy" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save emergency info" }));

    await waitFor(() =>
      expect(mockedUpdateMyIceInfoAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          iceMedicalHistory: "Asthma and peanut allergy",
          iceName: "Existing Contact",
          iceMedicalAid: "Discovery",
          iceMedicalAidNumber: "MA-1",
          iceDob: "1990-04-12T00:00:00.000Z",
        }),
      ),
    );
  });

  it("uploads an avatar from the avatar section", async () => {
    mockedUploadMyAvatarAsync.mockResolvedValue({
      user: { avatarUrl: "https://cdn.example.com/new-avatar.jpg" },
    });

    await renderWithQueryClient(<ProfileModal open onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Avatar" }));

    const fileInput = screen
      .getByRole("button", { name: "Choose file" })
      .querySelector("input[type='file']") as HTMLInputElement;
    const file = new File(["avatar"], "avatar.jpg", { type: "image/jpeg" });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() =>
      expect(mockedUploadMyAvatarAsync).toHaveBeenCalledWith({ file }),
    );
  });
});
