import { TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { ConfirmActionDialog } from "../ConfirmActionDialog";

type ConfirmPostponeMeetDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (message: string) => void;
  isLoading?: boolean;
};

export function ConfirmPostponeMeetDialog({
  open,
  onClose,
  onConfirm,
  isLoading = false,
}: ConfirmPostponeMeetDialogProps) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) {
      setMessage("");
    }
  }, [open]);

  return (
    <ConfirmActionDialog
      open={open}
      title="Postpone meet?"
      description="Postponing will keep the meet but pause it. You can update the meet details and reopen it later."
      confirmLabel="Postpone"
      onClose={onClose}
      onConfirm={() => onConfirm(message.trim())}
      isLoading={isLoading}
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
