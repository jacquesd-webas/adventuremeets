import { ConfirmActionDialog } from "../ConfirmActionDialog";

type ConfirmDeleteMeetDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
};

export function ConfirmDeleteMeetDialog({
  open,
  onClose,
  onConfirm,
  isLoading = false
}: ConfirmDeleteMeetDialogProps) {
  return (
    <ConfirmActionDialog
      open={open}
      title="Delete meet?"
      description="Deleting a draft meet cannot be undone."
      confirmLabel="Delete"
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  );
}
