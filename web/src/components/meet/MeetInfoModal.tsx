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
import { MeetWall } from "../wall/MeetWall";
import { useFetchMeet } from "../../hooks/useFetchMeet";
import { MeetStatusAlert } from "./MeetStatusAlert";
import { MeetStatusEnum } from "../../types/MeetStatusEnum";

type MeetInfoModalProps = {
  open: boolean;
  meetId?: string | null;
  onClose: () => void;
};

export function MeetInfoModal({ open, meetId, onClose }: MeetInfoModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { data: meet, isLoading } = useFetchMeet(meetId);
  const meetHasStarted =
    !!meet?.startTime &&
    !Number.isNaN(new Date(meet.startTime).getTime()) &&
    new Date(meet.startTime).getTime() <= Date.now();
  const shouldShowMeetWall =
    meet?.statusId === MeetStatusEnum.Completed ||
    (meet?.statusId === MeetStatusEnum.Closed && meetHasStarted);

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
              maxDescriptionLines={shouldShowMeetWall ? 2 : undefined}
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
            shouldShowMeetWall ? (
              <MeetWall meetId={meet.id} />
            ) : (
              <MeetStatusAlert
                meetId={meet.id}
                statusId={meet.statusId}
                openingDate={meet.openingDate}
                enableApply={true}
                shareCode={meet.shareCode}
                allowGuests={Boolean(meet.allowGuests)}
                size="small"
              />
            )
          ) : null}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
