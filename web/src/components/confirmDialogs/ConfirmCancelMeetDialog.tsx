import { useUpdateMeetStatus } from "../../hooks/useUpdateMeetStatus";
import MeetStatusEnum from "../../types/MeetStatusEnum";
import { ConfirmActionDialog } from "../ConfirmActionDialog";

type ConfirmCancelMeetDialogProps = {
  open: boolean;
  meetId?: string | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
};

export function ConfirmCancelMeetDialog({
  open,
  meetId,
  onClose,
  onConfirm,
  isLoading = false,
}: ConfirmCancelMeetDialogProps) {
  const { updateStatusAsync, isLoading: isSubmitting } = useUpdateMeetStatus();

  const handleCancelMeet = async () => {
    if (meetId) {
      await updateStatusAsync({ meetId, statusId: MeetStatusEnum.Cancelled });
    }
    onConfirm();
  };

  return (
    <ConfirmActionDialog
      open={open}
      title="Cancel meet?"
      description="Cancelling will notify all confirmed attendees of the cancellation and prevent any new submissions."
      confirmLabel="Cancel meet"
      onClose={onClose}
      onConfirm={handleCancelMeet}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
    />
  );
}
