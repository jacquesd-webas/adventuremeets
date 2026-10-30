import { useUpdateMeetStatus } from "../../hooks/useUpdateMeetStatus";
import MeetStatusEnum from "../../types/MeetStatusEnum";
import { ConfirmActionDialog } from "../ConfirmActionDialog";
import { OrganizerOverrideWarning } from "../OrganizerOverrideWarning";

type ConfirmCompleteMeetDialogProps = {
  open: boolean;
  meetId: string | null;
  isOrganizer?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmCompleteMeetDialog({
  open,
  meetId,
  isOrganizer,
  onClose,
  onConfirm,
}: ConfirmCompleteMeetDialogProps) {
  const { updateStatusAsync, isLoading } = useUpdateMeetStatus();

  const handleCompleteMeet = async () => {
    if (!meetId) return;
    await updateStatusAsync({ meetId, statusId: MeetStatusEnum.Completed });
    onConfirm();
  };

  return (
    <ConfirmActionDialog
      open={open}
      title="Complete meet?"
      description="Completing the meet will prevent further check-ins."
      confirmLabel="Complete meet"
      onClose={onClose}
      onConfirm={handleCompleteMeet}
      isSubmitting={isLoading}
      confirmDisabled={!meetId}
    >
      {!isOrganizer && <OrganizerOverrideWarning />}
    </ConfirmActionDialog>
  );
}
