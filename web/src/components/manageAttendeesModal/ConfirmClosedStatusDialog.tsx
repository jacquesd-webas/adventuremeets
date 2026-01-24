import ConfirmActionDialog from "../ConfirmActionDialog";
import { useSnackbar } from "notistack";
import { Box, Typography } from "@mui/material";
import Meet from "../../types/MeetModel";
import { Attendee } from "../../types/AttendeeModel";
import { useUpdateAttendeeStatus } from "../../hooks/useUpdateAttendeeStatus";
import { useDefaultMessage } from "../../hooks/useDefaultMessage";
import AttendeeStatusEnum from "../../types/AttendeeStatusEnum";

type ConfirmClosedStatusDialogProps = {
  open: boolean;
  meet: Meet;
  attendee?: Attendee;
  status?: AttendeeStatusEnum | null;
  onClose: () => void;
  onDone: () => void;
};

export function ConfirmClosedStatusDialog({
  open,
  meet,
  attendee,
  status,
  onClose,
  onDone,
}: ConfirmClosedStatusDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const { updateAttendeeStatusAsync, isLoading } = useUpdateAttendeeStatus();

  const { subject, content: messageContent } = useDefaultMessage(status, {
    meetName: meet.name,
    confirmMessage: meet.confirmMessage,
    waitlistMessage: meet.waitlistMessage,
    rejectMessage: meet.rejectMessage,
  });

  const handleConfirm = async () => {
    if (!status || !attendee || !meet.id) {
      onClose();
      return;
    }
    try {
      await updateAttendeeStatusAsync({
        meetId: meet.id,
        attendeeId: attendee.id,
        status,
        subject,
        text: messageContent,
      });
      enqueueSnackbar("Status updated and message sent", {
        variant: "success",
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
      });
      onDone();
    } catch (err: any) {
      enqueueSnackbar(err?.message || "Failed to update attendee", {
        variant: "error",
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
      });
    }
  };

  return (
    <ConfirmActionDialog
      open={open}
      title="Confirm"
      confirmLabel={isLoading ? "Sending..." : "Confirm"}
      cancelLabel="Cancel"
      onConfirm={handleConfirm}
      onClose={onClose}
    >
      <Box>
        <Typography variant="body2">
          {attendee?.respondedAt
            ? "This attendee has already received a notification about this meet. This action will send the following message:"
            : "This meet is already closed and all attendees notified. This action will send the following message to the attendee:"}
        </Typography>
        <Box
          sx={{
            mt: 2,
            p: 2,
            borderRadius: 1,
            bgcolor: "#f5f5f5",
            border: "1px solid #e0e0e0",
            whiteSpace: "pre-wrap",
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            {subject}
          </Typography>
          <Typography variant="body2">{messageContent}</Typography>
        </Box>
      </Box>
    </ConfirmActionDialog>
  );
}
