import { render, screen } from "@testing-library/react";
import { AttendeePanelHeader } from "../AttendeePanelHeader";
import { Attendee } from "../../../types/AttendeeModel";
import AttendeeStatusEnum from "../../../types/AttendeeStatusEnum";

describe("AttendeePanelHeader", () => {
  it("shows both contact details as chips in the mobile panel", () => {
    const attendee = {
      id: "attendee-1",
      name: "Alex Example",
      email: "alex@example.com",
      phone: "+27123456789",
      status: AttendeeStatusEnum.Confirmed,
    } as Attendee;

    render(
      <AttendeePanelHeader
        selectedAttendee={attendee}
        meet={null}
        isUpdating={false}
        isOrganizer={false}
        isOrganizerSelected
        hasUnreadMessages={false}
        detailView="responses"
        setDetailView={vi.fn()}
        handleUpdateStatus={vi.fn()}
        handleAttendeePaid={vi.fn()}
        fullscreen
      />,
    );

    expect(
      screen.getByText("alex@example.com").closest(".MuiChip-root"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("+27123456789").closest(".MuiChip-root"),
    ).toBeInTheDocument();
  });
});
