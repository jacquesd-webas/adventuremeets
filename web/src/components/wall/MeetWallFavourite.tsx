import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { ButtonBase, Stack, Typography } from "@mui/material";
import { WallItem } from "../../types/WallItemModel";

type MeetWallFavouriteProps = {
  item: WallItem;
  onFavourite?: (item: WallItem) => void;
};

export function MeetWallFavourite({
  item,
  onFavourite,
}: MeetWallFavouriteProps) {
  const isFavourite = item.favourite > 0;

  if (!isFavourite && !onFavourite) {
    return null;
  }

  const content = (
    <Stack
      direction="row"
      spacing={0.5}
      alignItems="center"
      justifyContent="flex-end"
      aria-label={isFavourite ? `Favourite ${item.favourite}` : "Favourite"}
      sx={{
        color: "text.secondary",
      }}
    >
      {isFavourite ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
      {isFavourite ? (
        <Typography variant="caption" fontWeight={600} color="inherit">
          {item.favourite}
        </Typography>
      ) : null}
    </Stack>
  );

  if (!onFavourite) {
    return content;
  }

  return (
    <ButtonBase
      onClick={() => {
        onFavourite(item);
      }}
      aria-label={isFavourite ? `Favourite ${item.favourite}` : "Favourite"}
      sx={{
        borderRadius: 999,
        p: 0.25,
        alignSelf: "flex-end",
      }}
    >
      {content}
    </ButtonBase>
  );
}

export default MeetWallFavourite;
