import { useState } from "react";
import ConfirmActionDialog from "../ConfirmActionDialog";
import { useApi } from "../../hooks/useApi";
import { useSnackbar } from "notistack";
import { Box, Typography } from "@mui/material";

type ConfirmClosedStatusDialogProps = {
  open: boolean;
  meet: {
    id: string;
    name?: string;
    confirmMessage?: string;
    waitlistMessage?: string;
    rejectMessage?: string;
  };
  attendeeId: string | null;
  status?: string | null;
  onClose: () => void;
  onDone: () => void;
};

const createMessageContent = (status: string | null | undefined) => {
  if (status === "confirmed") {
    return "Your attendance has been confirmed for the meet. Looking forward to seeing you there!";
  } else if (status === "waitlisted") {
    return "You have been waitlisted for the meet. If a spot opens up, the organizer will notify you.";
  } else if (status === "rejected") {
    return "Unfortunately, the meet organizer has not been able to accept your application. This is usually due to capacity limits being reached.";
  }
  return "Your attendance status has been updated.";
};

export function ConfirmClosedStatusDialog({
  open,
  meet,
  attendeeId,
  status,
  onClose,
  onDone,
}: ConfirmClosedStatusDialogProps) {
  const api = useApi();
  const { enqueueSnackbar } = useSnackbar();
  const [isSaving, setIsSaving] = useState(false);

  let messageContent = "";
  let subject = "";
  if (status === "confirmed") {
    subject = meet.name
      ? `Confirmed: ${meet.name}`
      : `Meet attendance confirmed`;
    messageContent = meet.confirmMessage
      ? meet.confirmMessage
      : createMessageContent(status);
  } else if (status === "waitlisted") {
    subject = meet.name
      ? `Waitlist: ${meet.name}`
      : `Meet attendance waitlisted`;
    messageContent = meet.waitlistMessage
      ? meet.waitlistMessage
      : createMessageContent(status);
  } else if (status === "rejected") {
    subject = meet.name ? `Update: ${meet.name}` : `Meet attendance update`;
    messageContent = meet.rejectMessage
      ? meet.rejectMessage
      : createMessageContent(status);
  }
  console.log({ status, subject, messageContent });

  const handleConfirm = async () => {
    if (!status || !attendeeId || !meet.id) {
      onClose();
      return;
    }
    setIsSaving(true);
    try {
      await api.patch(`/meets/${meet.id}/attendees/${attendeeId}`, { status });
      await api.post(`/meets/${meet.id}/message`, {
        subject: subject,
        text: messageContent,
        attendee_ids: [attendeeId],
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
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ConfirmActionDialog
      open={open}
      title="Confirm"
      content={
        <Box>
          <Typography variant="body2">
            This meet is already closed and all attendees notified. This action
            will send the following message to the attendee:
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
      }
      confirmText={isSaving ? "Sending..." : "Confirm"}
      cancelText="Cancel"
      onConfirm={handleConfirm}
      onClose={onClose}
    />
  );
}
