import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import { MeetActionsMenu } from "../MeetActionsMenu";
import MeetStatusEnum from "../../../types/MeetStatusEnum";

describe("MeetActionsMenu", () => {
  const renderMenu = (props?: {
    statusId?: number;
    canViewMeet?: boolean;
    canManageMeet?: boolean;
  }) => {
    render(
      <MemoryRouter>
        <MeetActionsMenu
          meetId="meet-1"
          statusId={props?.statusId ?? MeetStatusEnum.Draft}
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
    expect(screen.getByText("Attendees")).toBeInTheDocument();
    expect(screen.getByText("Create a copy").closest("li")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("shows the menu button even when the user cannot view or manage the meet", () => {
    render(
      <MemoryRouter>
        <MeetActionsMenu
          meetId="meet-1"
          statusId={MeetStatusEnum.Open}
          canViewMeet={false}
          canManageMeet={false}
          setSelectedMeetId={vi.fn()}
          setPendingAction={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
