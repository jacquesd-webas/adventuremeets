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
  beforeEach(() => {
    enqueueSnackbar.mockReset();
    updateAttendeeStatusAsync.mockReset();
  });

  it("sends status update with an edited message", async () => {
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

    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "Edited subject" },
    });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "Edited body" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(updateAttendeeStatusAsync).toHaveBeenCalledWith({
        meetId: "m1",
        attendeeId: "a1",
        status: AttendeeStatusEnum.Confirmed,
        sendMessage: true,
        subject: "Edited subject",
        text: "Edited body",
      });
    });
    expect(enqueueSnackbar).toHaveBeenCalled();
  });

  it("updates status without sending a message when notification is disabled", async () => {
    render(
      <ConfirmClosedStatusDialog
        open
        meet={{ id: "m1", name: "Meet" } as any}
        attendee={{ id: "a1", respondedAt: null } as any}
        status={AttendeeStatusEnum.Waitlisted}
        onClose={vi.fn()}
        onDone={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /send a notification to the attendee/i,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(updateAttendeeStatusAsync).toHaveBeenCalledWith({
        meetId: "m1",
        attendeeId: "a1",
        status: AttendeeStatusEnum.Waitlisted,
        sendMessage: false,
        subject: "Subject",
        text: "Body",
      });
    });
  });
});
