import { useUpdateMeetStatus } from "../../hooks/useUpdateMeetStatus";
import MeetStatusEnum from "../../types/MeetStatusEnum";
import { ConfirmActionDialog } from "../ConfirmActionDialog";

type ConfirmOpenMeetDialogProps = {
  open: boolean;
  meetId?: string | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
};

export function ConfirmOpenMeetDialog({
  open,
  meetId,
  onClose,
  onConfirm,
  isLoading = false,
}: ConfirmOpenMeetDialogProps) {
  const { updateStatusAsync, isLoading: isSubmitting } = useUpdateMeetStatus();

  const handleOpenMeet = async () => {
    if (meetId) {
      await updateStatusAsync({ meetId, statusId: MeetStatusEnum.Open });
    }
    onConfirm();
  };

  return (
    <ConfirmActionDialog
      open={open}
      title="Open meet?"
      description="Opening the meet will allow submissions."
      confirmLabel="Open meet"
      onClose={onClose}
      onConfirm={handleOpenMeet}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
    />
  );
}
