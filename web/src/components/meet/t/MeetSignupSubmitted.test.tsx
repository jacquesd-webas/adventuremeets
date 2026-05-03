import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../../../context/authContext";
import { MeetSignupSubmitted } from "../MeetSignupSubmitted";
import userEvent from "@testing-library/user-event";

const copyMyMetaValuesFromAttendeeAsync = vi.fn().mockResolvedValue({});
const success = vi.fn();
const error = vi.fn();

vi.mock("../../../hooks/useCopyMyMetaValuesFromAttendee", () => ({
  useCopyMyMetaValuesFromAttendee: () => ({
    copyMyMetaValuesFromAttendeeAsync,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../../hooks/useNotistack", () => ({
  useNotistack: () => ({
    success,
    error,
  }),
}));

describe("MeetSignupSubmitted", () => {
  beforeEach(() => {
    copyMyMetaValuesFromAttendeeAsync.mockClear();
    success.mockClear();
    error.mockClear();
  });

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

  it("copies answers immediately when remember my answers is checked", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AuthContext.Provider
          value={{
            user: { id: "user-1", email: "alice@example.com" },
            isLoading: false,
            isAuthenticated: true,
            meUpdatedAt: 0,
            refreshSession: vi.fn(),
            logout: vi.fn(),
          }}
        >
          <MeetSignupSubmitted
            hasIndemnity={false}
            meetId="meet-1"
            attendeeId="attendee-1"
          />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("checkbox", { name: /remember my answers/i }),
    );

    expect(copyMyMetaValuesFromAttendeeAsync).toHaveBeenCalledWith({
      meetId: "meet-1",
      attendeeId: "attendee-1",
    });
    expect(success).toHaveBeenCalled();
  });

  it("hides remember my answers for minor submissions", () => {
    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AuthContext.Provider
          value={{
            user: { id: "user-1", email: "alice@example.com" },
            isLoading: false,
            isAuthenticated: true,
            meUpdatedAt: 0,
            refreshSession: vi.fn(),
            logout: vi.fn(),
          }}
        >
          <MeetSignupSubmitted
            hasIndemnity={false}
            meetId="meet-1"
            attendeeId="attendee-1"
            isMinor
          />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("checkbox", { name: /remember my answers/i }),
    ).not.toBeInTheDocument();
  });
});
