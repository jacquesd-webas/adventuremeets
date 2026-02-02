import { fireEvent, render, screen } from "@testing-library/react";
import { AttendeeActionButtons } from "../AttendeeActionButtons";
import AttendeeStatusEnum from "../../../types/AttendeeStatusEnum";

describe("AttendeeActionButtons", () => {
  it("renders action buttons and updates status", () => {
    const onUpdateStatus = vi.fn();
    render(
      <AttendeeActionButtons
        attendee={{ id: "a1", status: AttendeeStatusEnum.Pending }}
        onUpdateStatus={onUpdateStatus}
      />
    );

    fireEvent.click(screen.getByText("Accept"));
    expect(onUpdateStatus).toHaveBeenCalledWith(AttendeeStatusEnum.Confirmed);
  });

  it("shows checked-in state", () => {
    const onUpdateStatus = vi.fn();
    render(
      <AttendeeActionButtons
        attendee={{ id: "a1", status: AttendeeStatusEnum.CheckedIn }}
        onUpdateStatus={onUpdateStatus}
      />
    );

    expect(screen.getByText("Checked In")).toBeInTheDocument();
    expect(screen.queryByText("Accept")).toBeNull();
  });
});
