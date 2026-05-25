import {
  Alert,
  Box,
  IconButton,
  SxProps,
  Stack,
  Theme,
  Tooltip,
  Typography,
} from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { useState } from "react";
import { useAuth } from "../../context/authContext";
import { useFetchMeetWall } from "../../hooks/useFetchMeetWall";
import { useFetchMeet } from "../../hooks/useFetchMeet";
import { useNotistack } from "../../hooks/useNotistack";
import { useUpdateWallItemFavourite } from "../../hooks/useUpdateWallItemFavourite";
import { useUpdateWallItemReaction } from "../../hooks/useUpdateWallItemReaction";
import { WallItem } from "../../types/WallItemModel";
import { MeetImageCarouselDialog } from "../meet/MeetImageCarouselDialog";
import { MeetWallActions } from "./MeetWallActions";
import { MeetWallCard } from "./MeetWallCard";

type MeetWallProps = {
  meetId: string;
  attendeeId?: string;
  sx?: SxProps<Theme>;
  onFavourite?: (item: WallItem) => void;
  onLike?: (item: WallItem) => void;
  onDislike?: (item: WallItem) => void;
};

type WallItemGroup = {
  key: string;
  items: WallItem[];
};

function getWallItemAuthorKey(item: WallItem) {
  return item.createdBy || item.attendeeId || item.authorName || "";
}

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

function groupWallItems(wallItems: WallItem[]) {
  const groups: Array<{ key: string; items: WallItem[] }> = [];

  wallItems.forEach((item) => {
    const previousGroup = groups[groups.length - 1];
    const previousItem = previousGroup?.items[previousGroup.items.length - 1];
    const itemAuthorKey = getWallItemAuthorKey(item);
    const previousAuthorKey = previousItem ? getWallItemAuthorKey(previousItem) : "";
    const canAppendToPhotoGroup =
      item.url &&
      previousItem?.url &&
      previousGroup?.items.length > 0 &&
      Boolean(itemAuthorKey) &&
      itemAuthorKey === previousAuthorKey;

    if (canAppendToPhotoGroup) {
      previousGroup.items.push(item);
      previousGroup.key = previousGroup.items.map((groupItem) => groupItem.id).join("-");
      return;
    }

    groups.push({
      key: item.id,
      items: [item],
    });
  });

  return groups;
}

function buildDisplayGroups(wallItems: WallItem[]): WallItemGroup[] {
  const favouritePost = sortFavouriteItems(
    wallItems.filter((item) => !item.url && item.favourite > 0),
  )[0];
  const favouritePhotos = sortFavouriteItems(
    wallItems.filter((item) => item.url && item.favourite > 0),
  );

  if (!favouritePost) {
    return groupWallItems(wallItems);
  }

  const extractedIds = new Set<string>([
    favouritePost.id,
    ...favouritePhotos.map((item) => item.id),
  ]);
  const remainingItems = wallItems.filter((item) => !extractedIds.has(item.id));

  return [
    {
      key: [favouritePost.id, ...favouritePhotos.map((item) => item.id)].join("-"),
      items: [favouritePost, ...favouritePhotos],
    },
    ...groupWallItems(remainingItems),
  ];
}

function buildWallPhotoDownloadName(item: WallItem, index: number) {
  const contentType = item.contentType ?? "";
  const extension = contentType.startsWith("image/")
    ? contentType.slice("image/".length)
    : "jpg";

  return `meet-wall-photo-${index + 1}.${extension}`;
}

export function MeetWall({
  meetId,
  attendeeId,
  sx,
  onFavourite,
  onLike,
  onDislike,
}: MeetWallProps) {
  const { user } = useAuth();
  const { data: meet } = useFetchMeet(meetId);
  const notice = useNotistack();
  const { updateWallItemFavouriteAsync } = useUpdateWallItemFavourite();
  const { updateWallItemReactionAsync } = useUpdateWallItemReaction();
  const { data: wallItems, isLoading, error } = useFetchMeetWall(
    meetId,
    attendeeId,
  );
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const isAdmin = Boolean(
    user?.organizations &&
      meet?.organizationId &&
      user.organizations[meet.organizationId] === "admin",
  );
  const canManageFavourites = Boolean(
    user?.id && meet && (user.id === meet.organizerId || isAdmin),
  );
  const groupedWallItems = buildDisplayGroups(wallItems);
  const allWallPhotos = wallItems
    .filter((item) => item.url)
    .map((item) => ({
      id: item.id,
      meetId: item.meetId,
      url: item.url!,
      isPrimary: false,
      aspect: item.aspect ?? "O",
      objectKey: item.objectKey,
      contentType: item.contentType,
      sizeBytes: item.sizeBytes,
      createdAt: item.createdAt,
    }));
  const getWallItemForPhoto = (photoId: string) =>
    wallItems.find((item) => item.id === photoId);

  const openPhotoCarousel = (item: WallItem) => {
    const targetIndex = allWallPhotos.findIndex((photo) => photo.id === item.id);
    if (targetIndex < 0) {
      return;
    }
    setActivePhotoIndex(targetIndex);
    setCarouselOpen(true);
  };

  const handleFavouriteToggle = async (item: WallItem) => {
    if (onFavourite) {
      onFavourite(item);
      return;
    }

    if (!canManageFavourites) {
      return;
    }

    const nextFavourite =
      item.favourite > 0
        ? 0
        : wallItems.reduce(
            (maxFavourite, wallItem) => Math.max(maxFavourite, wallItem.favourite),
            0,
          ) + 1;

    try {
      await updateWallItemFavouriteAsync({
        meetId,
        wallItemId: item.id,
        favourite: nextFavourite,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to update favourite";
      notice.error(message);
    }
  };

  const handleLike = async (item: WallItem) => {
    if (onLike) {
      onLike(item);
      return;
    }

    if (!user && !attendeeId) {
      return;
    }

    try {
      await updateWallItemReactionAsync({
        meetId,
        wallItemId: item.id,
        reaction: "like",
        attendeeId,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update reaction";
      notice.error(message);
    }
  };

  const handleDislike = async (item: WallItem) => {
    if (onDislike) {
      onDislike(item);
      return;
    }

    if (!user && !attendeeId) {
      return;
    }

    try {
      await updateWallItemReactionAsync({
        meetId,
        wallItemId: item.id,
        reaction: "dislike",
        attendeeId,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update reaction";
      notice.error(message);
    }
  };

  const downloadPhoto = (photoId: string, photoIndex: number) => {
    const item = getWallItemForPhoto(photoId);
    if (!item?.url || typeof document === "undefined") {
      return;
    }

    const link = document.createElement("a");
    link.href = item.url;
    link.download = buildWallPhotoDownloadName(item, photoIndex);
    link.rel = "noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (isLoading) {
    return (
      <Box sx={sx}>
        <Typography color="text.secondary">Loading meet wall...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={sx}>
        <Alert severity="warning">Unable to load the meet wall right now.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={sx}>
      <Stack spacing={2}>
        <MeetWallActions meetId={meetId} attendeeId={attendeeId} />
        {wallItems.length === 0 ? (
          <Alert severity="info" variant="outlined">
            No wall posts yet.
          </Alert>
        ) : (
          groupedWallItems.map((group) => {
            const primaryItem = group.items[0];
            const photoItems = group.items.filter((item) => item.url);

            return (
              <MeetWallCard
                key={group.key}
                groupKey={group.key}
                primaryItem={primaryItem}
                photoItems={photoItems}
                onPhotoClick={openPhotoCarousel}
                onFavourite={
                  onFavourite || canManageFavourites
                    ? handleFavouriteToggle
                    : undefined
                }
                onLike={onLike || user || attendeeId ? handleLike : undefined}
                onDislike={
                  onDislike || user || attendeeId ? handleDislike : undefined
                }
              />
            );
          })
        )}
      </Stack>
      <MeetImageCarouselDialog
        open={carouselOpen}
        title="Meet feedback photos"
        images={allWallPhotos}
        initialIndex={activePhotoIndex}
        onClose={() => {
          setCarouselOpen(false);
        }}
        onIndexChange={setActivePhotoIndex}
        renderActionSlot={(image, index) => {
          const activeItem = getWallItemForPhoto(image.id);
          const isFavourite = Boolean(activeItem && activeItem.favourite > 0);

          return (
            <Stack direction="row" spacing={0.5} alignItems="center">
              {activeItem && (canManageFavourites || isFavourite) ? (
                <>
                  <Tooltip
                    title={
                      isFavourite
                        ? `Favourite ${activeItem.favourite}`
                        : "Favourite"
                    }
                  >
                    <IconButton
                      aria-label={
                        isFavourite
                          ? `Favourite ${activeItem.favourite}`
                          : "Favourite"
                      }
                      onClick={() => {
                        void handleFavouriteToggle(activeItem);
                      }}
                      disabled={!canManageFavourites}
                      sx={{ color: "#fff" }}
                    >
                      {isFavourite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                    </IconButton>
                  </Tooltip>
                  {isFavourite ? (
                    <Typography variant="caption" fontWeight={700} color="inherit">
                      {activeItem.favourite}
                    </Typography>
                  ) : null}
                </>
              ) : null}
              <Tooltip title="Download photo">
                <IconButton
                  aria-label="Download photo"
                  onClick={() => downloadPhoto(image.id, index)}
                  sx={{ color: "#fff" }}
                >
                  <DownloadOutlinedIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          );
        }}
      />
    </Box>
  );
}

export default MeetWall;
