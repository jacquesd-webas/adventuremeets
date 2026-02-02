import { TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useUpdateMeetStatus } from "../../hooks/useUpdateMeetStatus";
import MeetStatusEnum from "../../models/MeetStatusEnum";
import { ConfirmActionDialog } from "../ConfirmActionDialog";

type ConfirmPostponeMeetDialogProps = {
  open: boolean;
  meetId?: string | null;
  onClose: () => void;
  onConfirm: (message: string) => void;
  isLoading?: boolean;
};

export function ConfirmPostponeMeetDialog({
  open,
  meetId,
  onClose,
  onConfirm,
  isLoading = false,
}: ConfirmPostponeMeetDialogProps) {
  const [message, setMessage] = useState("");
  const { updateStatusAsync, isLoading: isSubmitting } = useUpdateMeetStatus();

  useEffect(() => {
    if (!open) {
      setMessage("");
    }
  }, [open]);

  return (
    <ConfirmActionDialog
      open={open}
      title="Postpone meet?"
      description="Postponing the meet will notify all confirmed participants and pause the meet submissions. You can update the meet details and republish it later."
      confirmLabel="Postpone"
      onClose={onClose}
      onConfirm={async () => {
        if (meetId) {
          await updateStatusAsync({
            meetId,
            statusId: MeetStatusEnum.Postponed,
          });
        }
        onConfirm(message.trim());
      }}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
    >
      <TextField
        label="Message to participants (optional)"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        fullWidth
        multiline
        minRows={3}
        sx={{ mt: 2 }}
      />
    </ConfirmActionDialog>
  );
}
