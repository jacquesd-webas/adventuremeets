import { Alert, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useFetchMeet } from "../../hooks/useFetchMeet";
import { useFetchMeetAttendees } from "../../hooks/useFetchMeetAttendees";
import { useNotifyAttendee } from "../../hooks/useNotifyAttendee";
import { useUpdateMeetStatus } from "../../hooks/useUpdateMeetStatus";
import MeetStatusEnum from "../../types/MeetStatusEnum";
import { ConfirmActionDialog } from "../ConfirmActionDialog";
import { OrganizerOverrideWarning } from "../OrganizerOverrideWarning";

type ConfirmPostponeMeetDialogProps = {
  open: boolean;
  meetId?: string | null;
  canManageMeet?: boolean;
  isOrganizer?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
};

export function ConfirmPostponeMeetDialog({
  open,
  meetId,
  onClose,
  onConfirm,
  isOrganizer,
  isLoading = false,
}: ConfirmPostponeMeetDialogProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const trimmedMessage = message.trim();
  const { updateStatusAsync, isLoading: isUpdatingStatus } =
    useUpdateMeetStatus();
  const { notifyAttendeeAsync, isLoading: isSendingNotification } =
    useNotifyAttendee();
  const { data: meet } = useFetchMeet(meetId, open && Boolean(trimmedMessage));
  const {
    data: attendees,
    isLoading: areAttendeesLoading,
    error: attendeesError,
  } = useFetchMeetAttendees(
    meetId,
    open && Boolean(trimmedMessage) ? "all" : null,
  );

  useEffect(() => {
    if (!open) {
      setMessage("");
      setError(null);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!meetId) return;

    try {
      if (trimmedMessage) {
        if (areAttendeesLoading) {
          setError("Attendees are still loading");
          return;
        }
        if (attendeesError) {
          setError(attendeesError);
          return;
        }

        const attendeeIds = attendees.map((attendee) => attendee.id);
        if (attendeeIds.length) {
          await notifyAttendeeAsync({
            meetId,
            subject: meet?.name
              ? `${meet.name} has been postponed`
              : "Meet postponed",
            text: trimmedMessage,
            attendeeIds,
            markNotified: true,
          });
        }
      }

      setError(null);
      await updateStatusAsync({
        meetId,
        statusId: MeetStatusEnum.Postponed,
      });
      onConfirm();
    } catch (err: any) {
      setError(err?.message || "Failed to postpone meet");
    }
  };

  return (
    <ConfirmActionDialog
      open={open}
      title="Postpone meet?"
      description="Postponing the meet will pause the meet submissions. You can update the meet details and republish it later. Please check the attendees list and ensure to notify attendees of the postponement and any new date/time details once updated."
      confirmLabel="Postpone"
      onClose={onClose}
      onConfirm={handleConfirm}
      isLoading={isLoading}
      isSubmitting={isUpdatingStatus || isSendingNotification}
      confirmDisabled={Boolean(trimmedMessage) && areAttendeesLoading}
    >
      {error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : null}
      <TextField
        label="Message to participants (optional)"
        value={message}
        onChange={(event) => {
          setMessage(event.target.value);
          if (error) {
            setError(null);
          }
        }}
        fullWidth
        multiline
        minRows={3}
        sx={{ mt: 2 }}
      />
      {!isOrganizer && <OrganizerOverrideWarning />}
    </ConfirmActionDialog>
  );
}
