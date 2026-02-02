import { useUpdateMeetStatus } from "../../hooks/useUpdateMeetStatus";
import MeetStatusEnum from "../../models/MeetStatusEnum";
import { ConfirmActionDialog } from "../ConfirmActionDialog";

export type ConfirmCloseMeetDialogProps = {
  open: boolean;
  meetId: string | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
};

export function ConfirmCloseMeetDialog({
  open,
  meetId,
  onClose,
  onConfirm,
  isLoading = false,
}: ConfirmCloseMeetDialogProps) {
  const { updateStatusAsync, isLoading: isSubmitting } = useUpdateMeetStatus();

  const handleCloseMeet = async () => {
    if (!meetId) return;
    await updateStatusAsync({ meetId, statusId: MeetStatusEnum.Closed });
    onConfirm();
  };

  return (
    <ConfirmActionDialog
      open={open}
      title="Close meet?"
      description="Closing the meet will notify all attendees and prevent any new submissions."
      confirmLabel="Close meet"
      onClose={onClose}
      onConfirm={handleCloseMeet}
      isSubmitting={isSubmitting}
      isLoading={isLoading}
    />
  );
}
