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
  meetId: string;
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
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" fontWeight={700}>
              Meet details
            </Typography>
            <IconButton onClick={onClose} aria-label="Close meet details">
              <CloseIcon />
            </IconButton>
          </Stack>
          {meet ? (
            <MeetInfoSummary
              meet={meet}
              isPreview={false}
              showUserAction={false}
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
