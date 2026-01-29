import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MeetActionsMenu } from "../MeetActionsMenu";

const navigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

const renderWithRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

const openMenu = () => {
  fireEvent.click(screen.getByRole("button"));
};

const clickMenuItem = (label: string) => {
  openMenu();
  fireEvent.click(screen.getByRole("menuitem", { name: label }));
};

describe("MeetActionsMenu", () => {
  beforeEach(() => {
    navigate.mockClear();
  });

  it("shows edit/delete when draft", () => {
    const setSelectedMeetId = vi.fn();
    const setPendingAction = vi.fn();
    renderWithRouter(
      <MeetActionsMenu
        meetId="1"
        statusId={1}
        isOrganizer
        setSelectedMeetId={setSelectedMeetId}
        setPendingAction={setPendingAction}
      />
    );
    clickMenuItem("Edit");
    clickMenuItem("Delete");
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
        isOrganizer
        setSelectedMeetId={setSelectedMeetId}
        setPendingAction={setPendingAction}
      />
    );
    clickMenuItem("Open meet");
    clickMenuItem("Preview");
    expect(setSelectedMeetId).toHaveBeenCalledWith("2");
    expect(setPendingAction).toHaveBeenCalledWith("open");
    expect(setPendingAction).toHaveBeenCalledWith("preview");
  });

  it("shows attendees/postpone/close when open", () => {
    const setSelectedMeetId = vi.fn();
    const setPendingAction = vi.fn();
    renderWithRouter(
      <MeetActionsMenu
        meetId="3"
        statusId={3}
        isOrganizer
        setSelectedMeetId={setSelectedMeetId}
        setPendingAction={setPendingAction}
      />
    );
    clickMenuItem("Edit");
    clickMenuItem("Attendees");
    clickMenuItem("Postpone");
    clickMenuItem("Close meet");
    clickMenuItem("Preview");
    clickMenuItem("Cancel meet");
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
        isOrganizer
        setSelectedMeetId={setSelectedMeetId}
        setPendingAction={setPendingAction}
      />
    );
    clickMenuItem("Attendees");
    clickMenuItem("Cancel meet");
    openMenu();
    fireEvent.click(screen.getByText("Check-in"));
    expect(setSelectedMeetId).toHaveBeenCalledWith("4");
    expect(setPendingAction).toHaveBeenCalledWith("attendees");
    expect(setPendingAction).toHaveBeenCalledWith("cancel");
    expect(navigate).toHaveBeenCalledWith("/meet/4/checkin");
  });

  it("shows reports when completed", () => {
    const setSelectedMeetId = vi.fn();
    const setPendingAction = vi.fn();
    renderWithRouter(
      <MeetActionsMenu
        meetId="5"
        statusId={7}
        isOrganizer
        setSelectedMeetId={setSelectedMeetId}
        setPendingAction={setPendingAction}
      />
    );
    clickMenuItem("Generate Report");
    expect(setSelectedMeetId).toHaveBeenCalledWith("5");
    expect(setPendingAction).toHaveBeenCalledWith("report");
  });
});
