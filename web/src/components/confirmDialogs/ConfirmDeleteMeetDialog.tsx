import { useDeleteMeet } from "../../hooks/useDeleteMeet";
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
  meetId,
  onClose,
  onConfirm,
  isLoading = false,
}: ConfirmDeleteMeetDialogProps) {
  const { deleteMeetAsync, isLoading: isSubmitting } = useDeleteMeet();

  const handleDelete = async () => {
    if (meetId) {
      await deleteMeetAsync({ meetId });
    }
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
      isSubmitting={isSubmitting}
    />
  );
}
