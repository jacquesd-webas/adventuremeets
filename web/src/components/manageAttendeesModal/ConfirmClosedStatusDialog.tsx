import ConfirmActionDialog from "../ConfirmActionDialog";
import { useSnackbar } from "notistack";
import {
  Box,
  Checkbox,
  FormControlLabel,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
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
    invitationWording: meet.invitationWording,
    confirmMessage: meet.confirmMessage,
    waitlistMessage: meet.waitlistMessage,
    rejectMessage: meet.rejectMessage,
    isRsvpMode: meet.autoPlacement,
  });
  const [shouldSendMessage, setShouldSendMessage] = useState(true);
  const [editableSubject, setEditableSubject] = useState(subject);
  const [editableMessage, setEditableMessage] = useState(messageContent);
  const [cancellationStatus, setCancellationStatus] = useState<
    AttendeeStatusEnum | ""
  >("");
  const requiresReason =
    status === AttendeeStatusEnum.Rejected &&
    Boolean(attendee?.respondedAt) &&
    (attendee?.status === AttendeeStatusEnum.Confirmed ||
      attendee?.status === AttendeeStatusEnum.Waitlisted);
  const canSendMessage =
    Boolean(editableSubject.trim()) && Boolean(editableMessage.trim());

  useEffect(() => {
    if (!open) return;
    setShouldSendMessage(Boolean(subject.trim() && messageContent.trim()));
    setEditableSubject(subject);
    setEditableMessage(messageContent);
    setCancellationStatus("");
  }, [open, subject, messageContent]);

  const handleConfirm = async () => {
    if (!status || !attendee || !meet.id) {
      onClose();
      return;
    }
    if (requiresReason && !cancellationStatus) return;
    try {
      await updateAttendeeStatusAsync({
        meetId: meet.id,
        attendeeId: attendee.id,
        status: requiresReason ? cancellationStatus : status,
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
      confirmDisabled={
        (requiresReason && !cancellationStatus) ||
        (shouldSendMessage && !canSendMessage)
      }
    >
      <Box>
        <Typography sx={{ mb: 2 }} variant="body2">
          {attendee?.respondedAt
            ? requiresReason
              ? "This attendee has already received a notification about this meet. Please provide reason for the status change. You should also send a notification to the attendee to confirm or inform them of the change."
              : "This attendee has already received a notification about this meet. You can edit the message below or skip sending a new one."
            : "This meet is already closed. You can edit the message below before sending it, or update the status without sending a message."}
        </Typography>
        {requiresReason && (
          <TextField
            select
            fullWidth
            required
            label="Reason"
            value={cancellationStatus}
            SelectProps={{
              MenuProps: {
                sx: { zIndex: (theme) => theme.zIndex.modal + 201 },
              },
            }}
            onChange={(event) => {
              const nextStatus = event.target.value as AttendeeStatusEnum;
              setCancellationStatus(nextStatus);
              if (nextStatus === AttendeeStatusEnum.Cancelled) {
                setEditableSubject(`Cancelled: ${meet.name}`);
                setEditableMessage(
                  "Your attendance for this meet has been cancelled.",
                );
              } else if (nextStatus === AttendeeStatusEnum.NoShow) {
                setEditableSubject(`Attendance update: ${meet.name}`);
                setEditableMessage(
                  "Your attendance for this meet has been marked as a no-show.",
                );
              } else {
                setEditableSubject(subject);
                setEditableMessage(messageContent);
              }
            }}
            sx={{ mb: 2 }}
          >
            <MenuItem value={AttendeeStatusEnum.Cancelled}>
              Attendee cancelled
            </MenuItem>
            <MenuItem value={AttendeeStatusEnum.Rejected}>
              Organiser rejected
            </MenuItem>
            <MenuItem value={AttendeeStatusEnum.NoShow}>
              Late cancellation / No show
            </MenuItem>
          </TextField>
        )}
        <TextField
          label="Subject"
          value={editableSubject}
          onChange={(event) => setEditableSubject(event.target.value)}
          fullWidth
          disabled={!shouldSendMessage}
          sx={{ mb: 2 }}
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
