import { Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { ConfirmActionDialog } from "../ConfirmActionDialog";
import { useNotistack } from "../../hooks/useNotistack";
import { useConfirmAttendeeEmail } from "../../hooks/useConfirmAttendeeEmail";

type VerifyAttendeeEmailDialogProps = {
  open: boolean;
  onClose: () => void;
  meetId?: string | null;
  attendeeId?: string | null;
  onVerified: () => void;
};

export function VerifyAttendeeEmailDialog({
  open,
  onClose,
  meetId,
  attendeeId,
  onVerified,
}: VerifyAttendeeEmailDialogProps) {
  const { error } = useNotistack();
  const { confirmAttendeeEmailAsync, isLoading } = useConfirmAttendeeEmail(
    meetId,
    attendeeId,
  );
  const [confirmEmail, setConfirmEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  useEffect(() => {
    if (!open) {
      setConfirmEmail("");
      setEmailError(null);
    }
  }, [open]);

  const handleVerify = async () => {
    if (!meetId || !attendeeId) return;
    try {
      setEmailError(null);
      const res = await confirmAttendeeEmailAsync({ email: confirmEmail });
      if (!res.valid) {
        setEmailError("Email does not match meet application");
        return;
      }
      onVerified();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error(`Unable to verify email: ${message}`);
    }
  };

  return (
    <ConfirmActionDialog
      open={open}
      title="Verify your email"
      description="Please confirm the email address you used for this application."
      confirmLabel="Continue"
      confirmDisabled={!confirmEmail || !meetId || !attendeeId || isLoading}
      onConfirm={handleVerify}
      onClose={onClose}
      isSubmitting={isLoading}
    >
      <Stack spacing={1.5} mt={2}>
        <TextField
          label="Confirm email"
          placeholder="Enter the email used for this application"
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
          error={Boolean(emailError)}
          helperText={emailError || undefined}
          fullWidth
        />
        <Typography variant="body2" color="text.secondary">
          Enter the email you used for this application to continue.
        </Typography>
      </Stack>
    </ConfirmActionDialog>
  );
}
