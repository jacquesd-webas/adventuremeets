import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { MeetActionsMenu } from "../MeetActionsMenu";
import MeetStatusEnum from "../../../types/MeetStatusEnum";

describe("MeetActionsMenu", () => {
  const setMatchMedia = (matches: boolean) => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  };

  const renderMenu = (props?: {
    statusId?: number;
    isUpcoming?: boolean;
    startTime?: string | null;
    canViewMeet?: boolean;
    canManageMeet?: boolean;
    canAccessManageMenu?: boolean;
  }) => {
    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <MeetActionsMenu
          meetId="meet-1"
          statusId={props?.statusId ?? MeetStatusEnum.Draft}
          isUpcoming={props?.isUpcoming ?? false}
          startTime={props?.startTime}
          canAccessManageMenu={props?.canAccessManageMenu}
          canViewMeet={props?.canViewMeet}
          canManageMeet={props?.canManageMeet ?? true}
          setSelectedMeetId={vi.fn()}
          setPendingAction={vi.fn()}
        />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button"));
  };

  beforeEach(() => {
    setMatchMedia(false);
    vi.useRealTimers();
  });

  it("shows Delete for draft meets when user can manage the meet", () => {
    renderMenu({ statusId: MeetStatusEnum.Draft, canManageMeet: true });
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.getByText("Create a copy")).toBeInTheDocument();
    expect(screen.getByText("Preview")).toBeInTheDocument();
  });

  it("does not show Delete for non-draft meets", () => {
    renderMenu({ statusId: MeetStatusEnum.Open, canManageMeet: true });
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it("shows a limited menu for users who can view but not manage the meet", () => {
    renderMenu({
      statusId: MeetStatusEnum.Published,
      canViewMeet: true,
      canAccessManageMenu: false,
      canManageMeet: false,
    });

    expect(screen.getByText("Meet details")).toBeInTheDocument();
    expect(screen.getByText("Copy link")).toBeInTheDocument();
    expect(screen.queryByText("Preview")).not.toBeInTheDocument();
    expect(screen.queryByText("Attendees")).not.toBeInTheDocument();
    expect(screen.queryByText("Create a copy")).not.toBeInTheDocument();
    expect(screen.queryByText("Apply to meet")).not.toBeInTheDocument();
  });

  it("shows the full menu for organizers on other people's meets, with mutating actions disabled", () => {
    renderMenu({
      statusId: MeetStatusEnum.Open,
      isUpcoming: true,
      canViewMeet: true,
      canAccessManageMenu: true,
      canManageMeet: false,
    });

    expect(screen.getByText("Meet details")).toBeInTheDocument();
    expect(screen.getByText("Copy link")).toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(
      screen.getByText("Attendees").closest('[role="menuitem"]'),
    ).toHaveAttribute("aria-disabled", "true");
    expect(
      screen.getByText("Close meet").closest('[role="menuitem"]'),
    ).toHaveAttribute("aria-disabled", "true");
    expect(
      screen.getByText("Postpone").closest('[role="menuitem"]'),
    ).toHaveAttribute("aria-disabled", "true");
    expect(
      screen.getByText("Cancel meet").closest('[role="menuitem"]'),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("does not show Preview for non-draft and non-published meets", () => {
    renderMenu({
      statusId: MeetStatusEnum.Open,
      canViewMeet: true,
      canManageMeet: false,
    });

    expect(screen.queryByText("Preview")).not.toBeInTheDocument();
  });

  it("shows the menu button even when the user cannot view or manage the meet", () => {
    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <MeetActionsMenu
          meetId="meet-1"
          statusId={MeetStatusEnum.Open}
          isUpcoming={true}
          startTime={null}
          canAccessManageMenu={false}
          canViewMeet={false}
          canManageMeet={false}
          setSelectedMeetId={vi.fn()}
          setPendingAction={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("copies the public share url using /share/:code", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText,
      },
    });

    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <MeetActionsMenu
          meetId="meet-1"
          statusId={MeetStatusEnum.Open}
          isUpcoming={true}
          startTime={null}
          canAccessManageMenu={true}
          canViewMeet={true}
          canManageMeet={true}
          previewLinkCode="share-123"
          setSelectedMeetId={vi.fn()}
          setPendingAction={vi.fn()}
        />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("Copy link"));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        `${window.location.origin}/share/share-123`,
      );
    });
  });

  it("shows Generate Report for closed meets on the same day even if still upcoming", () => {
    const now = new Date();
    const sameDayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      0,
      0,
    ).toISOString();

    renderMenu({
      statusId: MeetStatusEnum.Closed,
      isUpcoming: true,
      startTime: sameDayStart,
      canManageMeet: true,
    });

    expect(screen.getByText("Generate Report")).toBeInTheDocument();
  });

  it("closes the mobile action drawer before dispatching meet details", async () => {
    setMatchMedia(true);
    const setSelectedMeetId = vi.fn();
    const setPendingAction = vi.fn();
    const user = userEvent.setup();

    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <MeetActionsMenu
          meetId="meet-1"
          statusId={MeetStatusEnum.Open}
          isUpcoming={true}
          startTime={null}
          canAccessManageMenu={false}
          canViewMeet={true}
          canManageMeet={false}
          setSelectedMeetId={setSelectedMeetId}
          setPendingAction={setPendingAction}
        />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("Meet details"));

    await waitFor(() => {
      expect(setSelectedMeetId).toHaveBeenCalledWith("meet-1");
      expect(setPendingAction).toHaveBeenCalledWith("details");
    });
  }, 10000);

  it("navigates to check-in using the explicit check-in path", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        initialEntries={["/plan?view=list"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route
            path="/plan"
            element={
              <MeetActionsMenu
                meetId="meet-1"
                statusId={MeetStatusEnum.Closed}
                isUpcoming={true}
                startTime={null}
                canAccessManageMenu={true}
                canViewMeet={true}
                canManageMeet={true}
                setSelectedMeetId={vi.fn()}
                setPendingAction={vi.fn()}
              />
            }
          />
          <Route
            path="/meet/:id/checkin"
            element={<div data-testid="checkin-page" />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("Check-in"));

    expect(await screen.findByTestId("checkin-page")).toBeInTheDocument();
  });

  it("navigates to preview using the explicit public meet path", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        initialEntries={["/plan"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route
            path="/plan"
            element={
              <MeetActionsMenu
                meetId="meet-1"
                statusId={MeetStatusEnum.Draft}
                isUpcoming={true}
                startTime={null}
                canAccessManageMenu={true}
                canViewMeet={true}
                canManageMeet={true}
                previewLinkCode="share-123"
                setSelectedMeetId={vi.fn()}
                setPendingAction={vi.fn()}
              />
            }
          />
          <Route
            path="/meets/:code"
            element={<div data-testid="preview-page" />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("Preview"));

    expect(await screen.findByTestId("preview-page")).toBeInTheDocument();
  });
});
