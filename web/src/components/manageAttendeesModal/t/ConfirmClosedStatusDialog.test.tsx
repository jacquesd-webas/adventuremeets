import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ConfirmClosedStatusDialog } from "../ConfirmClosedStatusDialog";
import AttendeeStatusEnum from "../../../types/AttendeeStatusEnum";

const enqueueSnackbar = vi.fn();
const updateAttendeeStatusAsync = vi.fn();

vi.mock("notistack", () => ({
  useSnackbar: () => ({ enqueueSnackbar }),
}));

vi.mock("../../../hooks/useUpdateAttendeeStatus", () => ({
  useUpdateAttendeeStatus: () => ({
    updateAttendeeStatusAsync,
    isLoading: false,
  }),
}));

vi.mock("../../../hooks/useDefaultMessage", () => ({
  useDefaultMessage: () => ({
    subject: "Subject",
    content: "Body",
  }),
}));

describe("ConfirmClosedStatusDialog", () => {
  it("sends status update and message", async () => {
    render(
      <ConfirmClosedStatusDialog
        open
        meet={{ id: "m1", name: "Meet" } as any}
        attendee={{ id: "a1", respondedAt: "2024-01-01" } as any}
        status={AttendeeStatusEnum.Confirmed}
        onClose={vi.fn()}
        onDone={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(updateAttendeeStatusAsync).toHaveBeenCalledWith({
        meetId: "m1",
        attendeeId: "a1",
        status: AttendeeStatusEnum.Confirmed,
        subject: "Subject",
        text: "Body",
      });
    });
    expect(enqueueSnackbar).toHaveBeenCalled();
  });
});
