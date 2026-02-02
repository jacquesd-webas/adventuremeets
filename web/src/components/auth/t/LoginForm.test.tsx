import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LoginForm } from "../LoginForm";

const loginAsync = vi.fn();
const refreshSession = vi.fn();
const navigate = vi.fn();

vi.mock("../../../hooks/useLogin", () => ({
  useLogin: () => ({
    loginAsync,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../../context/authContext", () => ({
  useAuth: () => ({
    refreshSession,
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

describe("LoginForm", () => {
  beforeEach(() => {
    loginAsync.mockReset().mockResolvedValue(undefined);
    refreshSession.mockReset().mockResolvedValue(undefined);
    navigate.mockReset();
  });

  it("submits credentials and calls onSuccess", async () => {
    const onSuccess = vi.fn();
    render(
      <MemoryRouter>
        <LoginForm onSuccess={onSuccess} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(loginAsync).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "password123",
      });
    });
    expect(refreshSession).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("navigates to home when onSuccess is not provided", async () => {
    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/");
    });
  });
});
