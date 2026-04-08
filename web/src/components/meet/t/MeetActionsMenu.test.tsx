import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import { MeetActionsMenu } from "../MeetActionsMenu";
import MeetStatusEnum from "../../../types/MeetStatusEnum";

describe("MeetActionsMenu", () => {
  const renderMenu = (props?: {
    statusId?: number;
    isOrganizer?: boolean;
  }) => {
    render(
      <MemoryRouter>
        <MeetActionsMenu
          meetId="meet-1"
          statusId={props?.statusId ?? MeetStatusEnum.Draft}
          isOrganizer={props?.isOrganizer ?? true}
          setSelectedMeetId={vi.fn()}
          setPendingAction={vi.fn()}
        />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button"));
  };

  it("shows Delete for draft meets when user can manage the meet", () => {
    renderMenu({ statusId: MeetStatusEnum.Draft, isOrganizer: true });
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("does not show Delete for non-draft meets", () => {
    renderMenu({ statusId: MeetStatusEnum.Open, isOrganizer: true });
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it("does not show Delete for draft meets when user cannot manage the meet", () => {
    renderMenu({ statusId: MeetStatusEnum.Draft, isOrganizer: false });
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });
});
