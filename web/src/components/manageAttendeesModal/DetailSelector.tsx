import { IconButton, Stack } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";

type DetailSelectorProps = {
  disabled?: boolean;
  onInfoClick?: () => void;
  onMailClick?: () => void;
  active?: "info" | "mail";
  showUnread?: boolean;
};

export function DetailSelector({
  disabled = false,
  onInfoClick,
  onMailClick,
  active,
  showUnread = false,
}: DetailSelectorProps) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <IconButton
        size="small"
        disabled={disabled}
        onClick={onInfoClick}
        aria-label="Show attendee details"
        color={active === "info" ? "primary" : "default"}
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
