import { useUpdateMeetStatus } from "../../hooks/useUpdateMeetStatus";
import MeetStatusEnum from "../../types/MeetStatusEnum";
import { ConfirmActionDialog } from "../ConfirmActionDialog";
import { Checkbox, FormControlLabel, Stack } from "@mui/material";
import { useState } from "react";

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
  const [notifyAttendees, setNotifyAttendees] = useState(false);

  const handleCloseMeet = async () => {
    if (!meetId) return;
    await updateStatusAsync({
      meetId,
      statusId: MeetStatusEnum.Closed,
      notifyAttendees,
    });
    onConfirm();
  };

  return (
    <ConfirmActionDialog
      open={open}
      title="Close meet?"
      description="Closing the meet will prevent any new submissions."
      confirmLabel="Close meet"
      onClose={onClose}
      onConfirm={handleCloseMeet}
      isSubmitting={isSubmitting}
      isLoading={isLoading}
    >
      <Stack spacing={1.5} mt={2}>
        <FormControlLabel
          control={
            <Checkbox
              checked={notifyAttendees}
              onChange={(event) => setNotifyAttendees(event.target.checked)}
            />
          }
          label="Notify attendees of their status"
        />
      </Stack>
    </ConfirmActionDialog>
  );
}
