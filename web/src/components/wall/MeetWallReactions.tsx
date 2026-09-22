import ThumbUpAltOutlinedIcon from "@mui/icons-material/ThumbUpAltOutlined";
import { Chip, Stack } from "@mui/material";
import { WallItem } from "../../types/WallItemModel";

type MeetWallReactionsProps = {
  item: WallItem;
  onLike?: (item: WallItem) => void;
  onDislike?: (item: WallItem) => void;
};

export function MeetWallReactions({
  item,
  onLike,
  onDislike,
}: MeetWallReactionsProps) {
  const showLikeChip =
    item.likesCount > 0 || Boolean(onLike) || Boolean(onDislike);
  const handleLikeClick = item.likedByMe ? onDislike : onLike;

  if (!showLikeChip) {
    return null;
  }

  return (
    <Stack
      direction="row"
      spacing={1}
      useFlexGap
      flexWrap="wrap"
      alignItems="center"
    >
      {showLikeChip ? (
        <Chip
          icon={<ThumbUpAltOutlinedIcon />}
          label={
            item.likesCount > 0
              ? `${item.likesCount} like${item.likesCount === 1 ? "" : "s"}`
              : "Like"
          }
          size="small"
          variant="outlined"
          onClick={
            handleLikeClick
              ? () => {
                  handleLikeClick(item);
                }
              : undefined
          }
          clickable={Boolean(handleLikeClick)}
        />
      ) : null}
    </Stack>
  );
}

export default MeetWallReactions;
