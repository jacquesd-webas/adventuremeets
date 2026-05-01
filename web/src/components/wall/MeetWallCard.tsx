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
      {primaryItem.url ? (
        <Stack alignItems="center" sx={{ pt: 2, px: 2 }}>
          <MeetPhotos photoItems={photoItems} onPhotoClick={onPhotoClick} />
        </Stack>
      ) : null}
      <Stack spacing={1.25} sx={{ p: 2 }}>
        <MeetRating stars={primaryItem.stars} />
        <MeetComment comment={primaryItem.comment} />
        {primaryItem.createdAt ||
        primaryItem.favourite > 0 ||
        primaryItem.likesCount > 0 ||
        onFavourite ||
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
            <MeetWallFavourite item={primaryItem} onFavourite={onFavourite} />
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
}

export default MeetWallCard;
