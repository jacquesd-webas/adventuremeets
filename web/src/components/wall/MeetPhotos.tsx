import { Box, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import type { ReactNode } from "react";
import { WallItem } from "../../types/WallItemModel";

type MeetPhotosProps = {
  photoItems: WallItem[];
  onPhotoClick: (item: WallItem) => void;
};

const PHOTO_GRID_WIDTH = 720;
const PHOTO_GRID_GAP = 8;
const PHOTO_GRID_HEIGHT = 340;
const PHOTO_TILE_HEIGHT = (PHOTO_GRID_HEIGHT - PHOTO_GRID_GAP) / 2;

function renderWallPhotoTile(item: WallItem, onClick: () => void) {
  return (
    <Box
      key={item.id}
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        width: "100%",
        height: "100%",
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
        src={item.url}
        alt="Meet wall post"
        sx={{
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: "cover",
          backgroundColor: "grey.100",
        }}
      />
    </Box>
  );
}

function renderWallPhotoMoreTile(hiddenPhotoCount: number, onClick: () => void) {
  return (
    <Stack
      key="photo-more"
      component="button"
      type="button"
      onClick={onClick}
      alignItems="center"
      justifyContent="center"
      sx={{
        width: "100%",
        height: "100%",
        p: 0,
        border: 0,
        borderRadius: 2,
        backgroundColor: "grey.200",
        color: "text.primary",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      <Typography variant="h5">{`+${hiddenPhotoCount}`}</Typography>
    </Stack>
  );
}

export function MeetPhotos({ photoItems, onPhotoClick }: MeetPhotosProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const maxVisiblePhotos = isMobile ? 4 : 6;
  const visibleWithoutPlaceholder = isMobile ? 3 : 5;
  const visiblePhotoItems = photoItems.slice(0, maxVisiblePhotos);
  const hiddenPhotoCount = Math.max(
    photoItems.length - visibleWithoutPlaceholder,
    0,
  );
  const tileNodes: ReactNode[] =
    photoItems.length > maxVisiblePhotos
      ? [
          renderWallPhotoTile(
            visiblePhotoItems[0],
            () => onPhotoClick(visiblePhotoItems[0]),
          ),
          renderWallPhotoTile(
            visiblePhotoItems[1],
            () => onPhotoClick(visiblePhotoItems[1]),
          ),
          renderWallPhotoTile(
            visiblePhotoItems[2],
            () => onPhotoClick(visiblePhotoItems[2]),
          ),
          ...(isMobile
            ? [
                renderWallPhotoMoreTile(hiddenPhotoCount, () =>
                  onPhotoClick(visiblePhotoItems[3]),
                ),
              ]
            : [
                renderWallPhotoTile(
                  visiblePhotoItems[3],
                  () => onPhotoClick(visiblePhotoItems[3]),
                ),
                renderWallPhotoTile(
                  visiblePhotoItems[4],
                  () => onPhotoClick(visiblePhotoItems[4]),
                ),
                renderWallPhotoMoreTile(hiddenPhotoCount, () =>
                  onPhotoClick(visiblePhotoItems[5]),
                ),
              ]),
        ]
      : visiblePhotoItems.map((item) =>
          renderWallPhotoTile(item, () => onPhotoClick(item)),
        );

  if (tileNodes.length === 1) {
    return (
      <Box
        sx={{
          width: "100%",
          maxWidth: PHOTO_GRID_WIDTH,
          height: PHOTO_GRID_HEIGHT,
        }}
      >
        {tileNodes[0]}
      </Box>
    );
  }

  if (tileNodes.length === 2) {
    return (
      <Box
        sx={{
          width: "100%",
          maxWidth: PHOTO_GRID_WIDTH,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: `${PHOTO_GRID_GAP}px`,
          height: PHOTO_TILE_HEIGHT,
        }}
      >
        {tileNodes}
      </Box>
    );
  }

  if (tileNodes.length === 3) {
    return (
      <Box
        sx={{
          width: "100%",
          maxWidth: PHOTO_GRID_WIDTH,
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: `${PHOTO_GRID_GAP}px`,
          height: PHOTO_GRID_HEIGHT,
        }}
      >
        <Box sx={{ gridRow: "1 / span 2", minWidth: 0, minHeight: 0 }}>
          {tileNodes[0]}
        </Box>
        <Box sx={{ minWidth: 0, minHeight: 0 }}>{tileNodes[1]}</Box>
        <Box sx={{ minWidth: 0, minHeight: 0 }}>{tileNodes[2]}</Box>
      </Box>
    );
  }

  if (isMobile && tileNodes.length === 4) {
    return (
      <Box
        sx={{
          width: "100%",
          maxWidth: PHOTO_GRID_WIDTH,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: `${PHOTO_GRID_GAP}px`,
          height: PHOTO_GRID_HEIGHT,
        }}
      >
        {tileNodes.map((node, index) => (
          <Box key={index} sx={{ minWidth: 0, minHeight: 0 }}>
            {node}
          </Box>
        ))}
      </Box>
    );
  }

  if (tileNodes.length === 5) {
    return (
      <Box
        sx={{
          width: "100%",
          maxWidth: PHOTO_GRID_WIDTH,
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: `${PHOTO_GRID_GAP}px`,
          height: PHOTO_GRID_HEIGHT,
        }}
      >
        <Box sx={{ gridRow: "1 / span 2", minWidth: 0, minHeight: 0 }}>
          {tileNodes[0]}
        </Box>
        <Box sx={{ minWidth: 0, minHeight: 0 }}>{tileNodes[1]}</Box>
        <Box sx={{ minWidth: 0, minHeight: 0 }}>{tileNodes[2]}</Box>
        <Box sx={{ minWidth: 0, minHeight: 0 }}>{tileNodes[3]}</Box>
        <Box sx={{ minWidth: 0, minHeight: 0 }}>{tileNodes[4]}</Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: PHOTO_GRID_WIDTH,
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        gap: `${PHOTO_GRID_GAP}px`,
        height: PHOTO_GRID_HEIGHT,
      }}
    >
      {tileNodes.map((node, index) => (
        <Box key={index} sx={{ minWidth: 0, minHeight: 0 }}>
          {node}
        </Box>
      ))}
    </Box>
  );
}

export default MeetPhotos;
