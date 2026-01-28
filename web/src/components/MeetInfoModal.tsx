import { Dialog, DialogContent, Stack, Typography } from "@mui/material";
import { MeetInfoSummary } from "./MeetInfoSummary";
import { useFetchMeet } from "../hooks/useFetchMeet";
import { MeetStatusAlert } from "./MeetStatusAlert";

type MeetInfoModalProps = {
  open: boolean;
  meetId: string;
  onClose: () => void;
};

export function MeetInfoModal({ open, meetId, onClose }: MeetInfoModalProps) {
  const { data: meet, isLoading } = useFetchMeet(meetId);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogContent sx={{ pt: 2.5 }}>
        <Stack spacing={2}>
          {meet ? (
            <MeetInfoSummary
              meet={meet}
              isPreview={false}
              showUserAction={false}
              onClose={onClose}
            />
          ) : isLoading ? (
            <Typography color="text.secondary">Loading meet...</Typography>
          ) : null}
          {meet ? (
            <MeetStatusAlert
              statusId={meet.statusId}
              openingDate={meet.openingDate}
              size="small"
            />
          ) : null}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
