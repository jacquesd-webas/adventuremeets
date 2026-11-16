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
      />,
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
      />,
    );

    expect(screen.getByText("Checked In")).toBeInTheDocument();
    expect(screen.queryByText("Accept")).toBeNull();
  });

  it("labels the rejection action Cancel only after a placement was notified", () => {
    const onUpdateStatus = vi.fn();
    const { rerender } = render(
      <AttendeeActionButtons
        attendee={{
          status: AttendeeStatusEnum.Confirmed,
          respondedAt: "2026-01-01",
        }}
        onUpdateStatus={onUpdateStatus}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onUpdateStatus).toHaveBeenCalledWith(AttendeeStatusEnum.Rejected);

    rerender(
      <AttendeeActionButtons
        attendee={{
          status: AttendeeStatusEnum.Waitlisted,
          respondedAt: "2026-01-01",
        }}
        onUpdateStatus={onUpdateStatus}
      />,
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();

    rerender(
      <AttendeeActionButtons
        attendee={{ status: AttendeeStatusEnum.Waitlisted, respondedAt: null }}
        onUpdateStatus={onUpdateStatus}
      />,
    );
    expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
  });
});
