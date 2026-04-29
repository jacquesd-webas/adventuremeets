import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import MeetImage from "../../types/MeetImageModel";

type MeetImageCardProps = {
  image: MeetImage;
  disabled?: boolean;
  isUpdating?: boolean;
  onSelectMain?: (imageId: string) => void;
};

export function MeetImageCard({
  image,
  disabled = false,
  isUpdating = false,
  onSelectMain,
}: MeetImageCardProps) {
  return (
    <Stack
      spacing={1.5}
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: "1px solid",
        borderColor: image.isPrimary ? "primary.main" : "divider",
        backgroundColor: image.isPrimary
          ? "action.selected"
          : "background.paper",
      }}
    >
      <Box
        component="img"
        src={image.url}
        alt="Meet"
        sx={{
          width: "100%",
          aspectRatio: "4 / 3",
          objectFit: "cover",
          borderRadius: 1.5,
          border: "1px solid",
          borderColor: "divider",
        }}
      />
      <Stack
        direction="row"
        spacing={1}
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography variant="body2" color="text.secondary">
          {image.contentType || "image"}
        </Typography>
        {image.isPrimary ? (
          <Chip label="Main image" color="primary" size="small" />
        ) : (
          <Button
            size="small"
            variant="outlined"
            disabled={disabled || isUpdating}
            onClick={() => onSelectMain?.(image.id)}
          >
            {isUpdating ? "Saving..." : "Set as main"}
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
