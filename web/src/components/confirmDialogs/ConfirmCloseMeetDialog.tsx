import { useUpdateMeetStatus } from "../../hooks/useUpdateMeetStatus";
import MeetStatusEnum from "../../types/MeetStatusEnum";
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
      description="Closing the meet will prevent any new submissions. You may notify all attendees using the message function in the attendees list."
      confirmLabel="Close meet"
      onClose={onClose}
      onConfirm={handleCloseMeet}
      isSubmitting={isSubmitting}
      isLoading={isLoading}
    />
  );
}
