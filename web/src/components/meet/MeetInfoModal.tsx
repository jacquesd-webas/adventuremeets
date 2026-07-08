import {
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { MeetInfoSummary } from "./MeetInfoSummary";
import { useFetchMeet } from "../../hooks/useFetchMeet";
import { MeetStatusAlert } from "./MeetStatusAlert";

type MeetInfoModalProps = {
  open: boolean;
  meetId?: string | null;
  onClose: () => void;
};

export function MeetInfoModal({ open, meetId, onClose }: MeetInfoModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { data: meet, isLoading } = useFetchMeet(meetId);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={isMobile ? false : "md"}
      fullScreen={isMobile}
      sx={{
        "& .MuiDialog-paper": {
          m: isMobile ? 0 : 2,
          borderRadius: isMobile ? 0 : 2,
        },
      }}
    >
      <DialogContent sx={{ pt: 2.5, pb: 3 }}>
        <Stack spacing={2}>
          {meet ? (
            <MeetInfoSummary
              meet={meet}
              isPreview={false}
              actionSlot={
                <IconButton
                  onClick={onClose}
                  size="small"
                  aria-label="Close meet details"
                  data-testid="close-meet-details"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              }
            />
          ) : isLoading ? (
            <Typography color="text.secondary">Loading meet...</Typography>
          ) : null}
          {meet ? (
            <MeetStatusAlert
              statusId={meet.statusId}
              openingDate={meet.openingDate}
              enableApply={true}
              shareCode={meet.shareCode}
              size="small"
            />
          ) : null}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
