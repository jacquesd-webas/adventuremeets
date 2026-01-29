import { IconButton, Stack } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";

type DetailSelectorProps = {
  disabled?: boolean;
  onInfoClick?: () => void;
  onMailClick?: () => void;
  active?: "info" | "mail";
};

export function DetailSelector({
  disabled = false,
  onInfoClick,
  onMailClick,
  active,
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
      >
        <MailOutlineIcon fontSize="medium" />
      </IconButton>
    </Stack>
  );
}
