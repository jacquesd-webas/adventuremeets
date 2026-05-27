import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import {
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import MeetImage from "../../types/MeetImageModel";

type MeetImageCardProps = {
  image: MeetImage;
  disabled?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
  onSelectMain?: (imageId: string) => void;
  onDelete?: (imageId: string) => void;
};

export function MeetImageCard({
  image,
  disabled = false,
  isUpdating = false,
  isDeleting = false,
  onSelectMain,
  onDelete,
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
      <Stack spacing={1}>
        <Stack
          direction="row"
          spacing={1}
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="body2" color="text.secondary">
            {image.contentType || "image"}
          </Typography>
          <Stack direction="row" spacing={0.5} alignItems="center">
            {image.isPrimary ? (
              <Chip label="Main image" color="primary" size="small" />
            ) : (
              <Tooltip title={isUpdating ? "Saving..." : "Set as main image"}>
                <span>
                  <IconButton
                    size="small"
                    color="primary"
                    aria-label="Set as main image"
                    disabled={disabled || isUpdating || isDeleting}
                    onClick={() => onSelectMain?.(image.id)}
                  >
                    <WorkspacePremiumOutlinedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}
            <Tooltip title={isDeleting ? "Deleting..." : "Delete image"}>
              <span>
                <IconButton
                  size="small"
                  color="error"
                  aria-label="Delete image"
                  disabled={disabled || isUpdating || isDeleting}
                  onClick={() => onDelete?.(image.id)}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
}
