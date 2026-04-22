import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../../../context/authContext";
import { MeetSignupSubmitted } from "../MeetSignupSubmitted";

describe("MeetSignupSubmitted", () => {
  it("renders confirmation content and CTA", () => {
    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AuthContext.Provider
          value={{
            user: undefined,
            isLoading: false,
            isAuthenticated: false,
            meUpdatedAt: 0,
            refreshSession: vi.fn(),
            logout: vi.fn(),
          }}
        >
          <MeetSignupSubmitted hasIndemnity={false} />
        </AuthContext.Provider>
      </MemoryRouter>,
    );
    expect(screen.getByText(/Application submitted/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Your application has been submitted/i),
    ).toBeInTheDocument();
  });
});
