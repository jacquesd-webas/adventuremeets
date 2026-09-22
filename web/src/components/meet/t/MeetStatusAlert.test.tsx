import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { MeetStatusAlert } from "../MeetStatusAlert";
import { MeetStatusEnum } from "../../../types/MeetStatusEnum";

const navigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    MemoryRouter: ({
      future,
      ...props
    }: React.ComponentProps<typeof actual.MemoryRouter>) =>
      React.createElement(actual.MemoryRouter, {
        ...props,
        future: {
          v7_startTransition: true,
          v7_relativeSplatPath: true,
          ...future,
        },
      }),
    useNavigate: () => navigate,
  };
});

vi.mock("../../../context/authContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../../hooks/useFetchMyMeetAttendee", () => ({
  useFetchMyMeetAttendee: vi.fn(),
}));

import { useAuth } from "../../../context/authContext";
import { useFetchMyMeetAttendee } from "../../../hooks/useFetchMyMeetAttendee";

describe("MeetStatusAlert", () => {
  beforeEach(() => {
    navigate.mockClear();
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      meUpdatedAt: 0,
      refreshSession: vi.fn(),
      logout: vi.fn(),
    });
    vi.mocked(useFetchMyMeetAttendee).mockReturnValue({
      attendee: null,
      isLoading: false,
      error: null,
    });
  });

  it("shows apply now for open meets without an existing application", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <MeetStatusAlert
          meetId="meet-1"
          statusId={MeetStatusEnum.Open}
          enableApply
          shareCode="share-1"
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: /apply now/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /apply now/i }));

    expect(navigate).toHaveBeenCalledWith("/meets/share-1");
  });

  it("shows view your application and sign up minor guest for signed-in users with an application", async () => {
    const user = userEvent.setup();

    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "user-1",
        email: "alice@example.com",
        phone: "+275550004444",
      },
      isAuthenticated: true,
      isLoading: false,
      meUpdatedAt: 0,
      refreshSession: vi.fn(),
      logout: vi.fn(),
    });
    vi.mocked(useFetchMyMeetAttendee).mockReturnValue({
      attendee: { id: "attendee-1" },
      isLoading: false,
      error: null,
    });

    render(
      <MemoryRouter>
        <MeetStatusAlert
          meetId="meet-1"
          statusId={MeetStatusEnum.Open}
          enableApply
          shareCode="share-1"
          allowGuests
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: /view your application/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign up minor guest/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /apply now/i }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /view your application/i }),
    );
    expect(navigate).toHaveBeenCalledWith("/meets/share-1/attendee-1");

    await user.click(
      screen.getByRole("button", { name: /sign up minor guest/i }),
    );
    expect(navigate).toHaveBeenCalledWith(
      "/meets/share-1?guestOf=attendee-1&isMinor=true",
    );
  });

  it("shows RSVP wording for open RSVP-style meets", async () => {
    const user = userEvent.setup();

    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "user-1",
        email: "alice@example.com",
        phone: "+275550004444",
      },
      isAuthenticated: true,
      isLoading: false,
      meUpdatedAt: 0,
      refreshSession: vi.fn(),
      logout: vi.fn(),
    });
    vi.mocked(useFetchMyMeetAttendee).mockReturnValue({
      attendee: { id: "attendee-1" },
      isLoading: false,
      error: null,
    });

    render(
      <MemoryRouter>
        <MeetStatusAlert
          meetId="meet-1"
          statusId={MeetStatusEnum.Open}
          enableApply
          shareCode="share-1"
          isRsvpMode
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/already rsvp'd for this meet/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /view your rsvp/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /view your rsvp/i }));
    expect(navigate).toHaveBeenCalledWith("/meets/share-1/attendee-1");
  });
});
