import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MeetActionsMenu } from "../MeetActionsMenu";

const renderWithRouter = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

const openMenu = () => {
  fireEvent.click(screen.getByRole("button"));
};

describe("MeetActionsMenu", () => {
  it("shows edit/delete when draft", () => {
    const setSelectedMeetId = vi.fn();
    const setPendingAction = vi.fn();
    renderWithRouter(
      <MeetActionsMenu
        meetId="1"
        statusId={1}
        setSelectedMeetId={setSelectedMeetId}
        setPendingAction={setPendingAction}
      />
    );
    openMenu();
    fireEvent.click(screen.getByText("Edit"));
    fireEvent.click(screen.getByText("Delete"));
    expect(setSelectedMeetId).toHaveBeenCalledWith("1");
    expect(setPendingAction).toHaveBeenCalledWith("edit");
    expect(setPendingAction).toHaveBeenCalledWith("delete");
  });

  it("shows open/preview/cancel when published", () => {
    const setSelectedMeetId = vi.fn();
    const setPendingAction = vi.fn();
    renderWithRouter(
      <MeetActionsMenu
        meetId="2"
        statusId={2}
        setSelectedMeetId={setSelectedMeetId}
        setPendingAction={setPendingAction}
      />
    );
    openMenu();
    fireEvent.click(screen.getByText("Open meet"));
    fireEvent.click(screen.getByText("Preview"));
    fireEvent.click(screen.getByText("Cancel meet"));
    expect(setSelectedMeetId).toHaveBeenCalledWith("2");
    expect(setPendingAction).toHaveBeenCalledWith("open");
    expect(setPendingAction).toHaveBeenCalledWith("preview");
    expect(setPendingAction).toHaveBeenCalledWith("cancel");
  });

  it("shows attendees/postpone/close when open", () => {
    const setSelectedMeetId = vi.fn();
    const setPendingAction = vi.fn();
    renderWithRouter(
      <MeetActionsMenu
        meetId="3"
        statusId={3}
        setSelectedMeetId={setSelectedMeetId}
        setPendingAction={setPendingAction}
      />
    );
    openMenu();
    fireEvent.click(screen.getByText("Edit"));
    fireEvent.click(screen.getByText("Attendees"));
    fireEvent.click(screen.getByText("Postpone"));
    fireEvent.click(screen.getByText("Close meet"));
    fireEvent.click(screen.getByText("Preview"));
    fireEvent.click(screen.getByText("Cancel meet"));
    expect(setSelectedMeetId).toHaveBeenCalledWith("3");
    expect(setPendingAction).toHaveBeenCalledWith("edit");
    expect(setPendingAction).toHaveBeenCalledWith("attendees");
    expect(setPendingAction).toHaveBeenCalledWith("postpone");
    expect(setPendingAction).toHaveBeenCalledWith("close");
    expect(setPendingAction).toHaveBeenCalledWith("preview");
    expect(setPendingAction).toHaveBeenCalledWith("cancel");
  });

  it("shows check-in/attendees when closed", () => {
    const setSelectedMeetId = vi.fn();
    const setPendingAction = vi.fn();
    renderWithRouter(
      <MeetActionsMenu
        meetId="4"
        statusId={4}
        setSelectedMeetId={setSelectedMeetId}
        setPendingAction={setPendingAction}
      />
    );
    openMenu();
    fireEvent.click(screen.getByText("Attendees"));
    fireEvent.click(screen.getByText("Check-in"));
    fireEvent.click(screen.getByText("Cancel meet"));
    expect(setSelectedMeetId).toHaveBeenCalledWith("4");
    expect(setPendingAction).toHaveBeenCalledWith("attendees");
    expect(setPendingAction).toHaveBeenCalledWith("checkin");
    expect(setPendingAction).toHaveBeenCalledWith("cancel");
  });

  it("shows reports when completed", () => {
    const setSelectedMeetId = vi.fn();
    const setPendingAction = vi.fn();
    renderWithRouter(
      <MeetActionsMenu
        meetId="5"
        statusId={7}
        setSelectedMeetId={setSelectedMeetId}
        setPendingAction={setPendingAction}
      />
    );
    openMenu();
    fireEvent.click(screen.getByText("Reports"));
    expect(setSelectedMeetId).toHaveBeenCalledWith("5");
    expect(setPendingAction).toHaveBeenCalledWith("report");
  });
});
