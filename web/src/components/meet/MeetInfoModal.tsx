import {
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import { useState } from "react";
import { MeetInfoSummary } from "./MeetInfoSummary";
import { MeetWall } from "../wall/MeetWall";
import { useFetchMeet } from "../../hooks/useFetchMeet";
import { useFetchMeetWall } from "../../hooks/useFetchMeetWall";
import { useNotistack } from "../../hooks/useNotistack";
import { useAuth } from "../../context/authContext";
import { MeetStatusAlert } from "./MeetStatusAlert";
import { MeetStatusEnum } from "../../types/MeetStatusEnum";
import { downloadFavouriteWallArchive } from "../wall/downloadFavouriteWallArchive";
import { WallItem } from "../../types/WallItemModel";

type MeetInfoModalProps = {
  open: boolean;
  meetId?: string | null;
  onClose: () => void;
};

function sortFavouriteItems(items: WallItem[]) {
  return [...items].sort((a, b) => {
    if (b.favourite !== a.favourite) {
      return b.favourite - a.favourite;
    }

    const aCreatedAt = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bCreatedAt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bCreatedAt - aCreatedAt;
  });
}

export function MeetInfoModal({ open, meetId, onClose }: MeetInfoModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { user } = useAuth();
  const notice = useNotistack();
  const { data: meet, isLoading } = useFetchMeet(meetId);
  const [isExportingFavourites, setIsExportingFavourites] = useState(false);
  const meetHasStarted =
    !!meet?.startTime &&
    !Number.isNaN(new Date(meet.startTime).getTime()) &&
    new Date(meet.startTime).getTime() <= Date.now();
  const shouldShowMeetWall =
    meet?.statusId === MeetStatusEnum.Completed ||
    (meet?.statusId === MeetStatusEnum.Closed && meetHasStarted);
  const { data: wallItems } = useFetchMeetWall(
    meet?.id,
    undefined,
    open && shouldShowMeetWall,
  );
  const isAdmin = Boolean(
    user?.organizations &&
      meet?.organizationId &&
      user.organizations[meet.organizationId] === "admin",
  );
  const favouritePost =
    sortFavouriteItems(wallItems.filter((item) => !item.url && item.favourite > 0))[0] ??
    null;
  const favouritePhotos = sortFavouriteItems(
    wallItems.filter((item) => item.url && item.favourite > 0),
  );
  const hasFavouriteExport = Boolean(favouritePost || favouritePhotos.length > 0);

  const handleDownloadFavourites = async () => {
    if (!meet || !isAdmin || !hasFavouriteExport) {
      return;
    }

    try {
      setIsExportingFavourites(true);
      await downloadFavouriteWallArchive({
        meetName: meet.name,
        favouritePost,
        favouritePhotos,
      });
      notice.success("Favourites downloaded");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to download favourites";
      notice.error(message);
    } finally {
      setIsExportingFavourites(false);
    }
  };

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
                <Stack direction="row" spacing={0.5} alignItems="center">
                  {shouldShowMeetWall && isAdmin ? (
                    <Tooltip title="Download favourites">
                      <span>
                        <IconButton
                          onClick={() => {
                            void handleDownloadFavourites();
                          }}
                          size="small"
                          aria-label="Download favourites"
                          disabled={!hasFavouriteExport || isExportingFavourites}
                        >
                          <DownloadOutlinedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  ) : null}
                  <IconButton
                    onClick={onClose}
                    size="small"
                    aria-label="Close meet details"
                    data-testid="close-meet-details"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Stack>
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
