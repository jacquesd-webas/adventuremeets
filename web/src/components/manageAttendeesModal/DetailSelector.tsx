import { IconButton, Stack } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";

type DetailSelectorProps = {
  disabled?: boolean;
  onInfoClick?: () => void;
  onMailClick?: () => void;
  onEditClick?: () => void;
  active?: "info" | "mail";
  showUnread?: boolean;
  showEdit?: boolean;
};

export function DetailSelector({
  disabled = false,
  onInfoClick,
  onMailClick,
  onEditClick,
  active,
  showUnread = false,
  showEdit = false,
}: DetailSelectorProps) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {showEdit && (
        <IconButton
          size="small"
          disabled={disabled}
          onClick={onEditClick}
          aria-label="Edit attendee"
        >
          <EditOutlinedIcon fontSize="medium" />
        </IconButton>
      )}
      <IconButton
        size="small"
        disabled={disabled}
        onClick={onInfoClick}
        aria-label="Show attendee details"
        color={active === "info" ? "primary" : "default"}
        sx={{
          borderBottom: "2px solid",
          borderBottomColor:
            active === "info" ? "primary.main" : "transparent",
          borderRadius: 0,
          pb: 0.25,
        }}
      >
        <InfoOutlinedIcon fontSize="medium" />
      </IconButton>
      <IconButton
        size="small"
        disabled={disabled}
        onClick={onMailClick}
        aria-label="Message attendee"
        color={active === "mail" ? "primary" : "default"}
        sx={{
          position: "relative",
          borderBottom: "2px solid",
          borderBottomColor:
            active === "mail" ? "primary.main" : "transparent",
          borderRadius: 0,
          pb: 0.25,
          ...(showUnread && {
            "&::after": {
              content: '""',
              position: "absolute",
              top: 2,
              right: 2,
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "error.main",
              boxShadow: (theme) => `0 0 0 2px ${theme.palette.background.paper}`,
            },
          }),
        }}
      >
        <MailOutlineIcon fontSize="medium" />
      </IconButton>
    </Stack>
  );
}
