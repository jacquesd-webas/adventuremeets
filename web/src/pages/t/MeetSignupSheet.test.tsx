import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import MeetSignupSheet from "../MeetSignupSheet";

const defaultMetaDefinitions = [
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
];

const mockedMeet: Record<string, any> = {
  id: "meet-1",
  name: "Mountain Hike",
  organizationId: "org-1",
  statusId: 3,
  allowGuests: false,
  hasIndemnity: false,
  metaDefinitions: defaultMetaDefinitions,
};

const mockedOrganization = {
  id: "org-1",
  theme: null,
  isPrivate: false,
  customField1Name: undefined,
  customField2Name: undefined,
  customField1HelperText: undefined,
  customField2HelperText: undefined,
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
let mockedIsAuthenticated = true;
const addAttendeeAsync = vi.fn().mockResolvedValue({
  attendee: { id: "attendee-1" },
});
const scrollIntoViewDescriptor = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "scrollIntoView",
);

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
    user: mockedIsAuthenticated ? mockedUser : null,
    isAuthenticated: mockedIsAuthenticated,
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
  afterEach(() => {
    if (scrollIntoViewDescriptor) {
      Object.defineProperty(
        HTMLElement.prototype,
        "scrollIntoView",
        scrollIntoViewDescriptor,
      );
    } else {
      delete (HTMLElement.prototype as { scrollIntoView?: unknown })
        .scrollIntoView;
    }
  });

  beforeEach(() => {
    addAttendeeAsync.mockClear();
    mockedIsAuthenticated = true;
    mockedMeet.statusId = 3;
    mockedMeet.checkinPin = undefined;
    mockedMeet.requireEmail = undefined;
    mockedMeet.requirePhone = undefined;
    mockedMeet.requireOrg1 = undefined;
    mockedMeet.requireOrg2 = undefined;
    mockedMeet.hasIndemnity = false;
    mockedMeet.hasPdfIndemnityTemplate = false;
    mockedMeet.needIndemnityConfirmationEmail = false;
    mockedMeet.metaDefinitions = defaultMetaDefinitions;
    mockedMeet.allowGuests = false;
    mockedMeet.customField1Name = undefined;
    mockedMeet.customField2Name = undefined;
    mockedMeet.customField1HelperText = undefined;
    mockedMeet.customField2HelperText = undefined;
    mockedOrganization.customField1Name = undefined;
    mockedOrganization.customField2Name = undefined;
    mockedOrganization.customField1HelperText = undefined;
    mockedOrganization.customField2HelperText = undefined;
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

  it("groups adjacent categories in order and expands a collapsed group with errors", async () => {
    const user = userEvent.setup();
    mockedMeet.metaDefinitions = [
      {
        id: "travel-1",
        fieldKey: "travel1",
        label: "Outbound transport",
        fieldType: "text",
        category: "T",
        required: true,
      },
      {
        id: "travel-2",
        fieldKey: "travel2",
        label: "Return transport",
        fieldType: "text",
        category: "T",
        required: false,
      },
      {
        id: "medical-1",
        fieldKey: "medical1",
        label: "Medical notes",
        fieldType: "text",
        category: "M",
        required: false,
      },
      {
        id: "travel-3",
        fieldKey: "travel3",
        label: "Other transport",
        fieldType: "text",
        category: "T",
        required: false,
      },
      {
        id: "indemnity-1",
        fieldKey: "indemnity1",
        label: "Indemnity detail",
        fieldType: "text",
        category: "I",
        required: false,
      },
      {
        id: "pdf-1",
        fieldKey: "pdf1",
        label: "PDF detail",
        fieldType: "text",
        category: "P",
        required: false,
      },
      {
        id: "none-1",
        fieldKey: "none1",
        label: "Other detail",
        fieldType: "text",
        category: "N",
        required: false,
      },
    ];
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

    const transportHeaders = screen.getAllByRole("button", {
      name: "Transport",
    });
    expect(transportHeaders).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Medical" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Indemnity" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "PDF" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "None" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Outbound transport" }),
    ).toBeVisible();
    expect(
      screen.getByRole("textbox", { name: "Other transport" }),
    ).toBeVisible();

    await user.click(transportHeaders[0]);
    expect(transportHeaders[0]).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("textbox", { name: "Outbound transport" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Other transport" }),
    ).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: "Submit application" }),
    );
    expect(
      await screen.findByText("Outbound transport is required"),
    ).toBeInTheDocument();
    expect(transportHeaders[0]).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("textbox", { name: "Outbound transport" }),
    ).toBeVisible();
  });

  it("keeps submit enabled and scrolls to the first invalid field", async () => {
    mockedIsAuthenticated = false;
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
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

    const submit = await screen.findByRole("button", {
      name: "Submit application",
    });
    expect(submit).toBeEnabled();
    await user.click(submit);

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Phone is required")).toBeInTheDocument();
    expect(addAttendeeAsync).not.toHaveBeenCalled();
    expect(submit).toBeEnabled();
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
    expect(document.activeElement).toBe(
      screen.getByPlaceholderText("Your name"),
    );
  });

  it("validates required questions and indemnity on click, then submits after correction", async () => {
    const user = userEvent.setup();
    mockedMeet.hasIndemnity = true;
    mockedMeet.indemnity = "Standard waiver";
    mockedMeet.metaDefinitions = [
      ...defaultMetaDefinitions,
      {
        id: "meta-3",
        fieldKey: "medicalDetails",
        label: "Medical details",
        fieldType: "text",
        required: true,
      },
    ];
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

    await waitFor(() =>
      expect(screen.getByDisplayValue("Alice Walker")).toBeInTheDocument(),
    );
    const submit = screen.getByRole("button", { name: "Submit application" });
    expect(submit).toBeEnabled();
    await user.click(submit);
    expect(screen.getByText("Medical details is required")).toBeInTheDocument();
    expect(
      screen.getByText("Accept the indemnity to continue"),
    ).toBeInTheDocument();
    expect(addAttendeeAsync).not.toHaveBeenCalled();

    await user.type(
      screen.getByRole("textbox", { name: /Medical details/i }),
      "None",
    );
    await user.click(
      screen.getByRole("checkbox", { name: "I accept the indemnity" }),
    );
    expect(
      screen.queryByText("Medical details is required"),
    ).not.toBeInTheDocument();
    await user.click(submit);
    await waitFor(() => expect(addAttendeeAsync).toHaveBeenCalled());
  });

  it("disables submit while the signup is being saved", async () => {
    const user = userEvent.setup();
    let resolveSubmit:
      | ((value: { attendee: { id: string } }) => void)
      | undefined;
    addAttendeeAsync.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve;
        }),
    );
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

    await waitFor(() =>
      expect(screen.getByDisplayValue("Alice Walker")).toBeInTheDocument(),
    );
    const submit = screen.getByRole("button", { name: "Submit application" });
    await user.click(submit);
    await waitFor(() => expect(addAttendeeAsync).toHaveBeenCalled());
    expect(submit).toBeDisabled();

    resolveSubmit?.({ attendee: { id: "attendee-1" } });
    expect(await screen.findByText("Submitted")).toBeInTheDocument();
  });

  it("explains when indemnity acceptance requires email confirmation", async () => {
    mockedIsAuthenticated = false;
    mockedMeet.hasIndemnity = true;
    mockedMeet.indemnity = "Standard waiver";
    mockedMeet.needIndemnityConfirmationEmail = true;
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
      await screen.findByText(
        "Not signed in? We'll email you a link to confirm your indemnity acceptance after you submit.",
      ),
    ).toBeInTheDocument();
  });

  it("does not show the indemnity email alert when signed in", async () => {
    mockedMeet.hasIndemnity = true;
    mockedMeet.indemnity = "Standard waiver";
    mockedMeet.needIndemnityConfirmationEmail = true;
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

    await screen.findByText("Standard waiver");
    expect(screen.queryByText(/Not signed in\?/)).not.toBeInTheDocument();
  });

  it("skips electronic indemnity acceptance when a PDF form is supplied", async () => {
    const user = userEvent.setup();
    mockedMeet.hasIndemnity = true;
    mockedMeet.hasPdfIndemnityTemplate = true;
    mockedMeet.indemnity = "Standard waiver";
    mockedMeet.needIndemnityConfirmationEmail = true;
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
    expect(screen.queryByText("Standard waiver")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "I accept the indemnity" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Submit application" }),
    ).toBeEnabled();

    await user.click(
      screen.getByRole("button", { name: "Submit application" }),
    );
    await waitFor(() => {
      expect(addAttendeeAsync).toHaveBeenCalledWith(
        expect.objectContaining({ indemnityAccepted: false }),
      );
    });
  });

  it("hides the indemnity email confirmation message for PDF forms", async () => {
    mockedIsAuthenticated = false;
    mockedMeet.hasIndemnity = true;
    mockedMeet.hasPdfIndemnityTemplate = true;
    mockedMeet.indemnity = "Standard waiver";
    mockedMeet.needIndemnityConfirmationEmail = true;
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

    expect(await screen.findByText("Mountain Hike")).toBeInTheDocument();
    expect(screen.queryByText("Standard waiver")).not.toBeInTheDocument();
    expect(screen.queryByText(/Not signed in\?/)).not.toBeInTheDocument();
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

  it("shows organisation custom fields when required and includes them in the signup payload", async () => {
    const user = userEvent.setup();
    mockedMeet.requireOrg1 = true;
    mockedMeet.requireOrg2 = true;
    mockedMeet.customField1Name = "Club";
    mockedMeet.customField2Name = "Region";
    mockedMeet.customField1HelperText = "Enter your walking club";
    mockedMeet.customField2HelperText = "Enter your local region";
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

    expect(
      screen.getByPlaceholderText("Enter your walking club"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter your local region"),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("Club"), "Bushwalkers");
    await user.type(screen.getByLabelText("Region"), "West");
    await user.click(
      screen.getByRole("button", { name: "Submit application" }),
    );

    await waitFor(() => {
      expect(addAttendeeAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          meetId: "meet-1",
          org1Value: "Bushwalkers",
          org2Value: "West",
        }),
      );
    });
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
