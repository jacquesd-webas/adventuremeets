import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { MeetActionsMenu } from "../MeetActionsMenu";
import MeetStatusEnum from "../../../types/MeetStatusEnum";

describe("MeetActionsMenu", () => {
  const renderMenu = (props?: {
    statusId?: number;
    isUpcoming?: boolean;
    startTime?: string | null;
    canViewMeet?: boolean;
    canManageMeet?: boolean;
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
          canViewMeet={props?.canViewMeet}
          canManageMeet={props?.canManageMeet ?? true}
          setSelectedMeetId={vi.fn()}
          setPendingAction={vi.fn()}
        />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button"));
  };

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
      canManageMeet: false,
    });

    expect(screen.getByText("Meet details")).toBeInTheDocument();
    expect(screen.getByText("Preview")).toBeInTheDocument();
    expect(screen.getByText("Copy link")).toBeInTheDocument();
    expect(screen.queryByText("Attendees")).not.toBeInTheDocument();
    expect(screen.getByText("Create a copy").closest("li")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
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
          canViewMeet={true}
          canManageMeet={false}
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
});
