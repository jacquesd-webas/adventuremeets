import { ConfirmActionDialog } from "../ConfirmActionDialog";

type ConfirmCancelMeetDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
};

export function ConfirmCancelMeetDialog({
  open,
  onClose,
  onConfirm,
  isLoading = false
}: ConfirmCancelMeetDialogProps) {
  return (
    <ConfirmActionDialog
      open={open}
      title="Cancel meet?"
      description="Cancelling will prevent participants from joining."
      confirmLabel="Cancel meet"
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  );
}
