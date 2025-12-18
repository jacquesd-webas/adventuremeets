import { ConfirmActionDialog } from "../ConfirmActionDialog";

type ConfirmOpenMeetDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
};

export function ConfirmOpenMeetDialog({
  open,
  onClose,
  onConfirm,
  isLoading = false
}: ConfirmOpenMeetDialogProps) {
  return (
    <ConfirmActionDialog
      open={open}
      title="Open meet?"
      description="Opening the meet will allow participants to join."
      confirmLabel="Open meet"
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  );
}
