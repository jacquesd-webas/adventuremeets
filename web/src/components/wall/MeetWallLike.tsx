import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import ThumbUpAltOutlinedIcon from "@mui/icons-material/ThumbUpAltOutlined";
import ThumbDownAltIcon from "@mui/icons-material/ThumbDownAlt";
import ThumbDownAltOutlinedIcon from "@mui/icons-material/ThumbDownAltOutlined";
import { ButtonBase, Stack, Typography } from "@mui/material";
import { WallItem } from "../../types/WallItemModel";

type MeetWallLikeProps = {
  item: WallItem;
  onLike?: (item: WallItem) => void;
  onDislike?: (item: WallItem) => void;
};

export function MeetWallLike({
  item,
  onLike,
  onDislike,
}: MeetWallLikeProps) {
  const canToggleLike = Boolean(onLike || onDislike);
  const currentReaction = item.myReaction ?? (item.likedByMe ? "like" : undefined);
  const showLike = item.likesCount > 0 || canToggleLike;
  const label =
    item.likesCount > 0
      ? `${item.likesCount} like${item.likesCount === 1 ? "" : "s"}`
      : "Like";
  const showDislike = canToggleLike;

  if (!showLike && !showDislike) {
    return null;
  }

  return (
    <Stack
      direction="row"
      spacing={0.5}
      alignItems="center"
      sx={{ color: "text.secondary" }}
    >
      {showLike ? (
        onLike ? (
          <ButtonBase
            onClick={() => {
              onLike(item);
            }}
            aria-label={label}
            sx={{
              borderRadius: 999,
              p: 0.25,
            }}
          >
            <Stack direction="row" spacing={0.5} alignItems="center">
              {currentReaction === "like" ? (
                <ThumbUpAltIcon fontSize="small" />
              ) : (
                <ThumbUpAltOutlinedIcon fontSize="small" />
              )}
              {item.likesCount > 0 ? (
                <Typography variant="caption" fontWeight={600} color="inherit">
                  {item.likesCount}
                </Typography>
              ) : null}
            </Stack>
          </ButtonBase>
        ) : (
          <Stack direction="row" spacing={0.5} alignItems="center" aria-label={label}>
            {currentReaction === "like" ? (
              <ThumbUpAltIcon fontSize="small" />
            ) : (
              <ThumbUpAltOutlinedIcon fontSize="small" />
            )}
            {item.likesCount > 0 ? (
              <Typography variant="caption" fontWeight={600} color="inherit">
                {item.likesCount}
              </Typography>
            ) : null}
          </Stack>
        )
      ) : null}
      {showDislike ? (
        onDislike ? (
          <ButtonBase
            onClick={() => {
              onDislike(item);
            }}
            aria-label="Dislike"
            sx={{
              borderRadius: 999,
              p: 0.25,
            }}
          >
            {currentReaction === "dislike" ? (
              <ThumbDownAltIcon fontSize="small" />
            ) : (
              <ThumbDownAltOutlinedIcon fontSize="small" />
            )}
          </ButtonBase>
        ) : (
          <Stack aria-label="Dislike">
            {currentReaction === "dislike" ? (
              <ThumbDownAltIcon fontSize="small" />
            ) : (
              <ThumbDownAltOutlinedIcon fontSize="small" />
            )}
          </Stack>
        )
      ) : null}
    </Stack>
  );
}

export default MeetWallLike;
