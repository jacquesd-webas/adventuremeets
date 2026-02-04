import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MeetSignupSubmitted } from "../../meet/MeetSignupSubmitted";
import { AuthContext } from "../../../context/authContext";

const navigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

describe("MeetSignupSubmitted", () => {
  beforeEach(() => {
    navigate.mockClear();
  });

  it("navigates to register with state when creating profile", () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            user: undefined,
            isLoading: false,
            isAuthenticated: false,
            refreshSession: vi.fn(),
            logout: vi.fn(),
          }}
        >
          <MeetSignupSubmitted
            firstName="Alex"
            lastName="Doe"
            email="alex@example.com"
            phoneCountry="ZA"
            phoneLocal="123"
            organizationId="org-1"
            attendeeId="att-1"
            shareCode="share-1"
          />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Create Profile" }));
    expect(navigate).toHaveBeenCalledWith("/register", {
      state: {
        firstName: "Alex",
        lastName: "Doe",
        email: "alex@example.com",
        phoneCountry: "ZA",
        phoneLocal: "123",
        organizationId: "org-1",
        meetId: undefined,
        shareCode: "share-1",
        attendeeId: "att-1",
      },
    });
  });

  it("shows status button for authenticated users", () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            user: { id: "u1" } as any,
            isLoading: false,
            isAuthenticated: true,
            refreshSession: vi.fn(),
            logout: vi.fn(),
          }}
        >
          <MeetSignupSubmitted attendeeId="att-1" shareCode="share-1" />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Show Status" }));
    expect(navigate).toHaveBeenCalledWith("/meets/share-1/att-1");
  });
});
