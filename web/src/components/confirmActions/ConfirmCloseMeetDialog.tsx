import { ConfirmActionDialog } from "../ConfirmActionDialog";

type ConfirmCloseMeetDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
};

export function ConfirmCloseMeetDialog({
  open,
  onClose,
  onConfirm,
  isLoading = false
}: ConfirmCloseMeetDialogProps) {
  return (
    <ConfirmActionDialog
      open={open}
      title="Close meet?"
      description="Closing the meet will prevent participants from joining."
      confirmLabel="Close meet"
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  );
}
