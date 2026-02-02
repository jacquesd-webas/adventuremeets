import { fireEvent, render, screen } from "@testing-library/react";
import { MeetActionsMenu } from "../MeetActionsMenu";

const openMenu = () => {
  fireEvent.click(screen.getByRole("button"));
};

describe("MeetActionsMenu", () => {
  it("shows edit/delete when draft", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<MeetActionsMenu meetId="1" statusId={1} onEdit={onEdit} onDelete={onDelete} />);
    openMenu();
    fireEvent.click(screen.getByText("Edit"));
    fireEvent.click(screen.getByText("Delete"));
    expect(onEdit).toHaveBeenCalledWith("1");
    expect(onDelete).toHaveBeenCalledWith("1");
  });

  it("shows open/preview/cancel when published", () => {
    const onOpen = vi.fn();
    const onPreview = vi.fn();
    const onDelete = vi.fn();
    render(<MeetActionsMenu meetId="2" statusId={2} onOpen={onOpen} onPreview={onPreview} onDelete={onDelete} />);
    openMenu();
    fireEvent.click(screen.getByText("Open meet"));
    fireEvent.click(screen.getByText("Preview"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(onOpen).toHaveBeenCalledWith("2");
    expect(onPreview).toHaveBeenCalledWith("2");
    expect(onDelete).toHaveBeenCalledWith("2");
  });

  it("shows attendees/postpone/close when open", () => {
    const onAttendees = vi.fn();
    const onPostpone = vi.fn();
    const onCloseMeet = vi.fn();
    const onEdit = vi.fn();
    const onPreview = vi.fn();
    const onDelete = vi.fn();
    render(
      <MeetActionsMenu
        meetId="3"
        statusId={3}
        onAttendees={onAttendees}
        onPostpone={onPostpone}
        onCloseMeet={onCloseMeet}
        onEdit={onEdit}
        onPreview={onPreview}
        onDelete={onDelete}
      />
    );
    openMenu();
    fireEvent.click(screen.getByText("Edit"));
    fireEvent.click(screen.getByText("Attendees"));
    fireEvent.click(screen.getByText("Postpone"));
    fireEvent.click(screen.getByText("Close meet"));
    fireEvent.click(screen.getByText("Preview"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(onEdit).toHaveBeenCalledWith("3");
    expect(onAttendees).toHaveBeenCalledWith("3");
    expect(onPostpone).toHaveBeenCalledWith("3");
    expect(onCloseMeet).toHaveBeenCalledWith("3");
    expect(onPreview).toHaveBeenCalledWith("3");
    expect(onDelete).toHaveBeenCalledWith("3");
  });

  it("shows check-in/attendees when closed", () => {
    const onAttendees = vi.fn();
    const onCheckin = vi.fn();
    const onDelete = vi.fn();
    render(<MeetActionsMenu meetId="4" statusId={4} onAttendees={onAttendees} onCheckin={onCheckin} onDelete={onDelete} />);
    openMenu();
    fireEvent.click(screen.getByText("Attendees"));
    fireEvent.click(screen.getByText("Check-in"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(onAttendees).toHaveBeenCalledWith("4");
    expect(onCheckin).toHaveBeenCalledWith("4");
    expect(onDelete).toHaveBeenCalledWith("4");
  });

  it("shows reports when completed", () => {
    const onReports = vi.fn();
    render(<MeetActionsMenu meetId="5" statusId={7} onReports={onReports} />);
    openMenu();
    fireEvent.click(screen.getByText("Reports"));
    expect(onReports).toHaveBeenCalledWith("5");
  });
});
