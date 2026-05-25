import { Box, Stack, Typography } from "@mui/material";
import { formatFriendlyTimestamp } from "../../helpers/formatFriendlyTimestamp";
import { WallItem } from "../../types/WallItemModel";
import { MeetComment } from "./MeetComment";
import { MeetWallFavourite } from "./MeetWallFavourite";
import { MeetWallLike } from "./MeetWallLike";
import { MeetPhotos } from "./MeetPhotos";
import { MeetRating } from "./MeetRating";

type MeetWallCardProps = {
  groupKey: string;
  primaryItem: WallItem;
  photoItems: WallItem[];
  onPhotoClick: (item: WallItem) => void;
  onFavourite?: (item: WallItem) => void;
  onLike?: (item: WallItem) => void;
  onDislike?: (item: WallItem) => void;
};

export function MeetWallCard({
  groupKey,
  primaryItem,
  photoItems,
  onPhotoClick,
  onFavourite,
  onLike,
  onDislike,
}: MeetWallCardProps) {
  const showFavouriteOnPanel = !(primaryItem.url && photoItems.length > 1);
  const usesFeaturedFavouriteLayout = !primaryItem.url && photoItems.length > 0;
  const featuredPhoto = usesFeaturedFavouriteLayout ? photoItems[0] : null;
  const featuredPhotoThumbnails = usesFeaturedFavouriteLayout
    ? photoItems.slice(1)
    : [];

  return (
    <Box
      key={groupKey}
      data-testid="meet-wall-card"
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
        backgroundColor: "background.paper",
      }}
    >
      {featuredPhoto ? (
        <Stack spacing={1.25} sx={{ pt: 2, px: 2 }}>
          <Box
            component="button"
            type="button"
            onClick={() => onPhotoClick(featuredPhoto)}
            sx={{
              width: "100%",
              display: "block",
              p: 0,
              border: 0,
              background: "none",
              cursor: "pointer",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Box
              component="img"
              src={featuredPhoto.url}
              alt="Meet wall post"
              sx={{
                width: "100%",
                maxHeight: 360,
                display: "block",
                objectFit: "cover",
                borderRadius: 2,
                backgroundColor: "grey.100",
              }}
            />
          </Box>
        </Stack>
      ) : photoItems.length > 0 ? (
        <Stack alignItems="center" sx={{ pt: 2, px: 2 }}>
          <MeetPhotos photoItems={photoItems} onPhotoClick={onPhotoClick} />
        </Stack>
      ) : null}
      <Stack spacing={1.25} sx={{ p: 2 }}>
        <MeetRating stars={primaryItem.stars} />
        <MeetComment comment={primaryItem.comment} />
        {primaryItem.createdAt ||
        (showFavouriteOnPanel && primaryItem.favourite > 0) ||
        primaryItem.likesCount > 0 ||
        (showFavouriteOnPanel && onFavourite) ||
        onLike ||
        onDislike ? (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
          >
            {primaryItem.createdAt || primaryItem.likesCount > 0 || onLike || onDislike ? (
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                useFlexGap
                flexWrap="wrap"
              >
                {primaryItem.createdAt ? (
                  <Typography variant="caption" color="text.secondary">
                    {`${formatFriendlyTimestamp(primaryItem.createdAt)}${
                      primaryItem.authorName ? ` by ${primaryItem.authorName}` : ""
                    }`}
                  </Typography>
                ) : null}
                <MeetWallLike
                  item={primaryItem}
                  onLike={onLike}
                  onDislike={onDislike}
                />
              </Stack>
            ) : (
              <span />
            )}
            {showFavouriteOnPanel ? (
              <MeetWallFavourite item={primaryItem} onFavourite={onFavourite} />
            ) : null}
          </Stack>
        ) : null}
        {featuredPhotoThumbnails.length > 0 ? (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              overflowX: "auto",
              overflowY: "hidden",
              pt: 0.5,
              pb: 0.25,
            }}
          >
            {featuredPhotoThumbnails.map((photoItem) => (
              <Box
                key={photoItem.id}
                component="button"
                type="button"
                onClick={() => onPhotoClick(photoItem)}
                sx={{
                  width: 92,
                  height: 68,
                  flexShrink: 0,
                  display: "block",
                  p: 0,
                  border: 0,
                  background: "none",
                  cursor: "pointer",
                  borderRadius: 1.5,
                  overflow: "hidden",
                }}
              >
                <Box
                  component="img"
                  src={photoItem.url}
                  alt="Meet wall post"
                  sx={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    objectFit: "cover",
                    borderRadius: 1.5,
                    backgroundColor: "grey.100",
                  }}
                />
              </Box>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
}

export default MeetWallCard;
