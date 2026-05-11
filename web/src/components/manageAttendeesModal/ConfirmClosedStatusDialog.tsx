import ConfirmActionDialog from "../ConfirmActionDialog";
import { useSnackbar } from "notistack";
import { Box, Checkbox, FormControlLabel, TextField, Typography } from "@mui/material";
import Meet from "../../types/MeetModel";
import { Attendee } from "../../types/AttendeeModel";
import { useUpdateAttendeeStatus } from "../../hooks/useUpdateAttendeeStatus";
import { useDefaultMessage } from "../../hooks/useDefaultMessage";
import AttendeeStatusEnum from "../../types/AttendeeStatusEnum";
import { useEffect, useState } from "react";

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
  const [shouldSendMessage, setShouldSendMessage] = useState(true);
  const [editableSubject, setEditableSubject] = useState(subject);
  const [editableMessage, setEditableMessage] = useState(messageContent);

  useEffect(() => {
    if (!open) return;
    setShouldSendMessage(true);
    setEditableSubject(subject);
    setEditableMessage(messageContent);
  }, [open, subject, messageContent]);

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
        sendMessage: shouldSendMessage,
        subject: editableSubject,
        text: editableMessage,
      });
      enqueueSnackbar(
        shouldSendMessage
          ? "Status updated and message sent"
          : "Status updated without sending a message",
        {
        variant: "success",
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
        },
      );
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
            ? "This attendee has already received a notification about this meet. You can edit the message below or skip sending a new one."
            : "This meet is already closed. You can edit the message below before sending it, or update the status without sending a message."}
        </Typography>
        <TextField
          label="Subject"
          value={editableSubject}
          onChange={(event) => setEditableSubject(event.target.value)}
          fullWidth
          disabled={!shouldSendMessage}
          sx={{ mt: 2, mb: 2 }}
        />
        <TextField
          label="Message"
          value={editableMessage}
          onChange={(event) => setEditableMessage(event.target.value)}
          fullWidth
          multiline
          minRows={5}
          disabled={!shouldSendMessage}
        />
        <FormControlLabel
          sx={{ mt: 2 }}
          control={
            <Checkbox
              checked={shouldSendMessage}
              onChange={(event) => setShouldSendMessage(event.target.checked)}
            />
          }
          label="Send a notification to the attendee"
        />
      </Box>
    </ConfirmActionDialog>
  );
}
