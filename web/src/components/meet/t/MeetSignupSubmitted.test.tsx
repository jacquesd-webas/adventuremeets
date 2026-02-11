import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../../../context/authContext";
import { MeetSignupSubmitted } from "../MeetSignupSubmitted";

describe("MeetSignupSubmitted", () => {
  it("renders confirmation content and CTA", () => {
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
          <MeetSignupSubmitted />
        </AuthContext.Provider>
      </MemoryRouter>,
    );
    expect(screen.getByText(/Application submitted/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Your application has been submitted/i),
    ).toBeInTheDocument();
  });
});
