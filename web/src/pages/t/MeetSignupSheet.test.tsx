import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import MeetSignupSheet from "../MeetSignupSheet";

const mockedMeet = {
  id: "meet-1",
  name: "Mountain Hike",
  organizationId: "org-1",
  statusId: 3,
  allowGuests: false,
  hasIndemnity: false,
  metaDefinitions: [
    {
      id: "meta-1",
      fieldKey: "dietary",
      label: "Dietary notes",
      fieldType: "text",
      required: false,
    },
    {
      id: "meta-2",
      fieldKey: "bringingWater",
      label: "Bringing extra water?",
      fieldType: "switch",
      required: false,
    },
  ],
};

const mockedOrganization = {
  id: "org-1",
  theme: null,
  isPrivate: false,
};

const mockedUser = {
  id: "user-1",
  firstName: "Alice",
  lastName: "Walker",
  email: "alice@example.com",
  phone: "+275550004444",
  idp_profile: { name: "Alice Walker" },
};

const mockedUserMetaValues = [
  { key: "dietary", value: "No peanuts" },
  { key: "bringingWater", value: "true" },
];
const addAttendeeAsync = vi.fn().mockResolvedValue({
  attendee: { id: "attendee-1" },
});

vi.mock("../../hooks/useFetchMeetSignup", () => ({
  useFetchMeetSignup: () => ({
    data: mockedMeet,
    isLoading: false,
  }),
}));

vi.mock("../../hooks/useFetchMeetAttendeeEdit", () => ({
  useFetchMeetAttendeeEdit: () => ({
    attendee: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("../../hooks/useFetchOrganization", () => ({
  useFetchOrganization: () => ({
    data: mockedOrganization,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../hooks/useAddAttendee", () => ({
  useAddAttendee: () => ({
    addAttendeeAsync,
    isLoading: false,
  }),
}));

vi.mock("../../hooks/useCheckMeetAttendee", () => ({
  useCheckMeetAttendee: () => ({
    checkAttendeeAsync: vi.fn().mockResolvedValue({ attendee: null }),
  }),
}));

vi.mock("../../hooks/useApi", () => ({
  useApi: () => ({
    patch: vi.fn(),
    del: vi.fn(),
  }),
}));

vi.mock("../../context/authContext", () => ({
  useAuth: () => ({
    user: mockedUser,
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));

vi.mock("../../hooks/useFetchUserMetaValues", () => ({
  useFetchUserMetaValues: () => ({
    data: mockedUserMetaValues,
    isLoading: false,
  }),
}));

vi.mock("../../context/ThemeModeContext", () => ({
  useThemeMode: () => ({
    mode: "light",
  }),
}));

vi.mock("../../helpers/organizationTheme", () => ({
  getOrganizationBackground: () => ({
    image: "",
    color: "rgb(255, 255, 255)",
  }),
}));

vi.mock("../../components/meet/MeetInfoSummary", () => ({
  MeetInfoSummary: ({
    meet,
    actionSlot,
  }: {
    meet: { name: string };
    actionSlot?: ReactNode;
  }) => (
    <div>
      <div>{meet.name}</div>
      <div>{actionSlot}</div>
    </div>
  ),
}));

vi.mock("../../components/meet/PreviewBanner", () => ({
  PreviewBanner: () => <div>Preview</div>,
}));

vi.mock("../../components/auth/LoginForm", () => ({
  LoginForm: () => <div>Login form</div>,
}));

vi.mock("../../components/meet/MeetStatusAlert", () => ({
  MeetStatusAlert: () => <div>Meet status banner</div>,
}));

vi.mock("../../components/meet/MeetSignupDuplicateDialog", () => ({
  MeetSignupDuplicateDialog: () => null,
}));

vi.mock("../../components/meet/MeetSignupSubmitted", () => ({
  MeetSignupSubmitted: () => <div>Submitted</div>,
}));

describe("MeetSignupSheet", () => {
  beforeEach(() => {
    addAttendeeAsync.mockClear();
    mockedMeet.statusId = 3;
    mockedMeet.checkinPin = undefined;
    mockedMeet.requireEmail = undefined;
    mockedMeet.requirePhone = undefined;
  });

  it("autofills the signed-in user's identity, phone, and saved autofill answers", async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/meets/share-123"]}>
          <Routes>
            <Route path="/meets/:code" element={<MeetSignupSheet />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("No peanuts")).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue("Alice Walker")).toBeInTheDocument();
    expect(screen.getByDisplayValue("alice@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("5550004444")).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /bringing extra water/i }),
    ).toBeChecked();
  });

  it("does not load autofill meta answers or show remember answers for minor signups", async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/meets/share-123?isMinor=true"]}>
          <Routes>
            <Route path="/meets/:code" element={<MeetSignupSheet />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("checkbox", { name: /fill in on-behalf of a minor/i }),
      ).toBeChecked();
    });

    expect(screen.queryByDisplayValue("No peanuts")).not.toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /bringing extra water/i }),
    ).not.toBeChecked();
  });

  it("hides email and phone when the meet does not require them", async () => {
    mockedMeet.requireEmail = false;
    mockedMeet.requirePhone = false;
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/meets/share-123"]}>
          <Routes>
            <Route path="/meets/:code" element={<MeetSignupSheet />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("Alice Walker")).toBeInTheDocument();
    });

    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Phone")).not.toBeInTheDocument();
    expect(
      screen.queryByDisplayValue("alice@example.com"),
    ).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("5550004444")).not.toBeInTheDocument();
  });

  it("passes the check-in pin through when signing up from a self-check-in handoff", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/meets/share-123?pin=PIN123"]}>
          <Routes>
            <Route path="/meets/:code" element={<MeetSignupSheet />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("Alice Walker")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: "Submit application" }),
    );

    await waitFor(() => {
      expect(addAttendeeAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          meetId: "meet-1",
          checkinPin: "PIN123",
        }),
      );
    });
  });

  it("allows a closed meet signup when a valid check-in pin is provided", async () => {
    const user = userEvent.setup();
    mockedMeet.statusId = 4;
    mockedMeet.checkinPin = "PIN123";
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/meets/share-123?pin=PIN123"]}>
          <Routes>
            <Route path="/meets/:code" element={<MeetSignupSheet />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("Alice Walker")).toBeInTheDocument();
    });

    expect(screen.queryByText("Meet status banner")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Submit application" }),
    ).toBeEnabled();

    await user.click(
      screen.getByRole("button", { name: "Submit application" }),
    );

    await waitFor(() => {
      expect(addAttendeeAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          meetId: "meet-1",
          checkinPin: "PIN123",
        }),
      );
    });
  });

  it("shows the meet status banner for closed meets without a valid check-in pin", async () => {
    mockedMeet.statusId = 4;
    mockedMeet.checkinPin = "PIN123";
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/meets/share-123?pin=WRONG"]}>
          <Routes>
            <Route path="/meets/:code" element={<MeetSignupSheet />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Meet status banner")).toBeInTheDocument();
  });

  it("shows meet not found for draft meets when preview is not enabled", async () => {
    mockedMeet.statusId = 1;
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/meets/share-123"]}>
          <Routes>
            <Route path="/meets/:code" element={<MeetSignupSheet />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: /meet not found/i }),
    ).toBeInTheDocument();
  });

  it("allows draft meets to render in preview mode", async () => {
    mockedMeet.statusId = 1;
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/meets/share-123?preview=true"]}>
          <Routes>
            <Route path="/meets/:code" element={<MeetSignupSheet />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Mountain Hike")).toBeInTheDocument();
    expect(screen.getByText("Preview")).toBeInTheDocument();
  });

  it("uses the preview close action as back to editing for editor previews", async () => {
    const user = userEvent.setup();
    const closeSpy = vi.spyOn(window, "close").mockImplementation(() => {});
    const openerDescriptor = Object.getOwnPropertyDescriptor(window, "opener");
    Object.defineProperty(window, "opener", {
      configurable: true,
      value: {},
    });
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter
          initialEntries={[
            "/meets/share-123?preview=true&previewSource=editor",
          ]}
        >
          <Routes>
            <Route path="/meets/:code" element={<MeetSignupSheet />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const closeButton = await screen.findByRole("button", {
      name: /back to editing/i,
    });
    await user.click(closeButton);

    expect(closeSpy).toHaveBeenCalled();

    closeSpy.mockRestore();
    if (openerDescriptor) {
      Object.defineProperty(window, "opener", openerDescriptor);
    } else {
      delete (window as Window & { opener?: Window | null }).opener;
    }
  });
});
