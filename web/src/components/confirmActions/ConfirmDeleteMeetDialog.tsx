import { ConfirmActionDialog } from "../ConfirmActionDialog";

type ConfirmDeleteMeetDialogProps = {
  open: boolean;
  meetId?: string | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
};

export function ConfirmDeleteMeetDialog({
  open,
  meetId: _meetId,
  onClose,
  onConfirm,
  isLoading = false
}: ConfirmDeleteMeetDialogProps) {
  const handleDelete = async () => {
    // Defer to caller for actual deletion, but keep signature consistent
    onConfirm();
  };

  return (
    <ConfirmActionDialog
      open={open}
      title="Delete meet?"
      description="Deleting a draft meet cannot be undone."
      confirmLabel="Delete"
      onClose={onClose}
      onConfirm={handleDelete}
      isLoading={isLoading}
    />
  );
}
