import { Stack, TextField, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { ConfirmActionDialog } from "../ConfirmActionDialog";
import { useConfirmAttendeeEmail } from "../../hooks/useConfirmAttendeeEmail";
import { useWithdrawMeetApplication } from "../../hooks/useWithdrawMeetApplication";

type WithdrawApplicationDialogProps = {
  open: boolean;
  onClose: () => void;
  meetId?: string | null;
  attendeeId?: string | null;
  attendeeStatus?: string | null;
};

export function WithdrawApplicationDialog({
  open,
  onClose,
  meetId,
  attendeeId,
  attendeeStatus,
}: WithdrawApplicationDialogProps) {
  const [confirmEmail, setConfirmEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const { confirmAttendeeEmailAsync, isLoading: isConfirming } =
    useConfirmAttendeeEmail(meetId, attendeeId);
  const { withdrawMeetApplicationAsync, isLoading: isWithdrawing } =
    useWithdrawMeetApplication(meetId, attendeeId);

  const withdrawDescription = useMemo(() => {
    switch (attendeeStatus) {
      case "confirmed":
        return "The organizer has already confirmed your application. Withdrawing may cause inconvenience, so be sure to also contact the organizer to let them know.";
      case "waitlisted":
        return "Withdrawing will remove you from the waitlist.";
      case "pending":
      default:
        return "Withdrawing will cancel your application.";
    }
  }, [attendeeStatus]);

  // Reset the form when the dialog is closed
  useEffect(() => {
    if (!open) {
      setConfirmEmail("");
      setEmailError(null);
    }
  }, [open]);

  const handleWithdraw = async () => {
    if (!meetId || !attendeeId) return;
    try {
      setEmailError(null);
      const res = await confirmAttendeeEmailAsync({ email: confirmEmail });
      if (!res.valid) {
        setEmailError("Email does not match meet application");
        return;
      }
      await withdrawMeetApplicationAsync();
      onClose();
    } catch (err) {
      console.warn("Error withdrawing application", err);
    }
  };

  return (
    <ConfirmActionDialog
      open={open}
      title="Withdraw application?"
      description={withdrawDescription}
      confirmLabel="Withdraw application"
      confirmDisabled={
        !confirmEmail || !meetId || !attendeeId || isWithdrawing || isConfirming
      }
      onConfirm={handleWithdraw}
      onClose={onClose}
      isSubmitting={isWithdrawing}
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
          Please use the same email address you used for this application to
          confirm.
        </Typography>
      </Stack>
    </ConfirmActionDialog>
  );
}
