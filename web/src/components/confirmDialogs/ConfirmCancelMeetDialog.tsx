import { useUpdateMeetStatus } from "../../hooks/useUpdateMeetStatus";
import MeetStatusEnum from "../../types/MeetStatusEnum";
import { ConfirmActionDialog } from "../ConfirmActionDialog";
import { OrganizerOverrideWarning } from "../OrganizerOverrideWarning";

type ConfirmCancelMeetDialogProps = {
  open: boolean;
  meetId?: string | null;
  canManageMeet?: boolean;
  isOrganizer?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
};

export function ConfirmCancelMeetDialog({
  open,
  meetId,
  onClose,
  onConfirm,
  isOrganizer,
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
      description="Cancelling will prevent any new submissions. Please check the attendees list and ensure to notify attendees of the cancellation."
      confirmLabel="Cancel meet"
      onClose={onClose}
      onConfirm={handleCancelMeet}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
    >
      {!isOrganizer && <OrganizerOverrideWarning />}
    </ConfirmActionDialog>
  );
}
