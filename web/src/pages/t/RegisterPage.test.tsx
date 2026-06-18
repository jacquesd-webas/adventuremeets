import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RegisterPage from "../RegisterPage";

const registerAsync = vi.fn();
const getGoogleAuthUrlAsync = vi.fn().mockResolvedValue({
  url: "https://google.example/oauth",
});
const getFacebookAuthUrlAsync = vi.fn().mockResolvedValue({
  url: "https://facebook.example/oauth",
});
const checkEmailExistsAsync = vi.fn().mockResolvedValue({ exists: false });
const refreshSession = vi.fn();
const success = vi.fn();
const apiGet = vi.fn();
const assignMock = vi.fn();

vi.mock("../../hooks/useRegister", () => ({
  useRegister: () => ({
    registerAsync,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../hooks/useGoogleAuthUrl", () => ({
  useGoogleAuthUrl: () => ({
    getGoogleAuthUrlAsync,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../hooks/useFacebookAuthUrl", () => ({
  useFacebookAuthUrl: () => ({
    getFacebookAuthUrlAsync,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../hooks/useCheckEmailExists", () => ({
  useCheckEmailExists: () => ({
    checkEmailExistsAsync,
  }),
}));

vi.mock("../../hooks/useApi", () => ({
  useApi: () => ({
    get: apiGet,
  }),
}));

vi.mock("../../context/authContext", () => ({
  useAuth: () => ({
    refreshSession,
  }),
}));

vi.mock("../../hooks/useNotistack", () => ({
  useNotistack: () => ({
    success,
  }),
}));

vi.mock("../../helpers/logo", () => ({
  getLogoSrc: () => "/logo.png",
}));

vi.mock("react-google-recaptcha", () => ({
  default: () => <div>recaptcha</div>,
}));

describe("RegisterPage", () => {
  beforeEach(() => {
    registerAsync.mockReset();
    getGoogleAuthUrlAsync.mockClear();
    getFacebookAuthUrlAsync.mockClear();
    checkEmailExistsAsync.mockClear();
    refreshSession.mockClear();
    success.mockClear();
    apiGet.mockReset();
    apiGet.mockResolvedValue({ allowed: true });
    assignMock.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        headers: { get: () => null },
      }),
    );
    vi.stubGlobal("location", {
      ...window.location,
      assign: assignMock,
      origin: window.location.origin,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps the method chooser visible when arriving from create profile state", () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/register",
            state: {
              firstName: "Alex",
              lastName: "Doe",
              email: "alex@example.com",
              organizationId: "org-1",
              shareCode: "share-1",
              attendeeId: "attendee-1",
            },
          },
        ]}
      >
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue with email/i }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument();
  });

  it("preserves the pending meet status return path when starting google signup", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/register",
            state: {
              firstName: "Alex",
              lastName: "Doe",
              email: "alex@example.com",
              organizationId: "org-1",
              shareCode: "share-1",
              attendeeId: "attendee-1",
            },
          },
        ]}
      >
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", { name: /continue with google/i }),
    );

    await waitFor(() => {
      expect(getGoogleAuthUrlAsync).toHaveBeenCalled();
    });

    const payload = getGoogleAuthUrlAsync.mock.calls[0][0];
    expect(payload.redirectUri).toContain("/oauth/callback/google");
    expect(JSON.parse(payload.state)).toEqual({
      invite: undefined,
      org: "org-1",
      returnTo: "/meets/share-1/attendee-1",
    });
  });

  it("prefills the email form from create profile state when email is selected", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/register",
            state: {
              firstName: "Alex",
              lastName: "Doe",
              email: "alex@example.com",
              organizationId: "org-1",
              shareCode: "share-1",
              attendeeId: "attendee-1",
            },
          },
        ]}
      >
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", { name: /continue with email/i }),
    );

    expect(screen.getByLabelText(/first name/i)).toHaveValue("Alex");
    expect(screen.getByLabelText(/last name/i)).toHaveValue("Doe");
    expect(screen.getByLabelText(/email/i)).toHaveValue("alex@example.com");
  });

  it("preserves invite and org when linking to login", () => {
    render(
      <MemoryRouter initialEntries={["/register?invite=invite-1&org=org-1"]}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: /already have an account/i }),
    ).toHaveAttribute("href", "/login?invite=invite-1&org=org-1");
  });
});
