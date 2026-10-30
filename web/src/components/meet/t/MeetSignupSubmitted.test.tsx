import { render, screen, waitFor } from "@testing-library/react";
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

  it("renders RSVP wording for RSVP-style meets", () => {
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
          <MeetSignupSubmitted hasIndemnity={false} isRsvpMode />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    expect(screen.getByText(/RSVP submitted/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Your RSVP has been submitted/i),
    ).toBeInTheDocument();
  });

  it("uses the named guest link for email invites and copying", async () => {
    const user = userEvent.setup();
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);

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
          <MeetSignupSubmitted
            hasIndemnity={false}
            namedGuests
            shareCode="share-code"
            attendeeId="host-1"
            guests={[{ name: "Guest Person", isMinor: false }]}
          />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    const guestLink = new URL("/meets/share-code", window.location.origin);
    guestLink.searchParams.set("guestOf", "host-1");
    guestLink.searchParams.set("name", "Guest Person");
    const mailto = new URL(
      screen.getByRole("link", { name: "Send invite" }).getAttribute("href")!,
    );
    expect(mailto.protocol).toBe("mailto:");
    expect(mailto.searchParams.get("body")).toContain(guestLink.toString());

    await user.click(screen.getByRole("button", { name: "Copy link" }));
    expect(writeText).toHaveBeenCalledWith(guestLink.toString());
    expect(success).toHaveBeenCalledWith("Guest invite link copied");
    writeText.mockRestore();
  });

  it.each([
    {
      namedGuests: true,
      hasIndemnity: false,
      hasPdfIndemnityTemplate: false,
      showsGuidance: true,
    },
    {
      namedGuests: false,
      hasIndemnity: true,
      hasPdfIndemnityTemplate: false,
      showsGuidance: true,
    },
    {
      namedGuests: false,
      hasIndemnity: true,
      hasPdfIndemnityTemplate: true,
      showsGuidance: true,
    },
    {
      namedGuests: false,
      hasIndemnity: false,
      hasPdfIndemnityTemplate: false,
      showsGuidance: false,
    },
  ])(
    "shows guest guidance for namedGuests=$namedGuests, hasIndemnity=$hasIndemnity, and PDF=$hasPdfIndemnityTemplate",
    ({ namedGuests, hasIndemnity, hasPdfIndemnityTemplate, showsGuidance }) => {
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
            <MeetSignupSubmitted
              hasIndemnity={hasIndemnity}
              hasPdfIndemnityTemplate={hasPdfIndemnityTemplate}
              namedGuests={namedGuests}
              shareCode="share-code"
              attendeeId="host-1"
              guests={[{ name: "Guest Person", isMinor: true }]}
            />
          </AuthContext.Provider>
        </MemoryRouter>,
      );

      const guidance = screen.queryByText(
        /You may optionally send your guests an invite link/,
      );
      const indemnityNote = screen.queryByText(
        /check with the organiser if you need your guests/,
      );
      expect(Boolean(guidance)).toBe(showsGuidance);
      expect(Boolean(indemnityNote)).toBe(hasIndemnity);
      expect(Boolean(screen.queryByRole("link", { name: "Send invite" }))).toBe(
        showsGuidance,
      );
      expect(
        Boolean(screen.queryByRole("button", { name: "Sign indemnity" })),
      ).toBe(hasIndemnity && !hasPdfIndemnityTemplate);
    },
  );

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
    await waitFor(() => {
      expect(success).toHaveBeenCalled();
      expect(
        screen.getByRole("checkbox", { name: /remember my answers/i }),
      ).toBeDisabled();
    });
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

  it("shows an error and resets the checkbox when saving answers fails", async () => {
    const user = userEvent.setup();
    copyMyMetaValuesFromAttendeeAsync.mockRejectedValueOnce(
      new Error("Unable to save answers"),
    );

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

    const checkbox = screen.getByRole("checkbox", {
      name: /remember my answers/i,
    });
    await user.click(checkbox);

    await waitFor(() => {
      expect(error).toHaveBeenCalledWith("Unable to save answers");
      expect(checkbox).not.toBeChecked();
    });
  });
});
