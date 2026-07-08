import { Box, IconButton, Tooltip } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

type LockedMeetProps = {
  canUnlock?: boolean;
  onUnlock?: () => void;
};

export function LockedMeet({ canUnlock, onUnlock }: LockedMeetProps) {
  const text = canUnlock
    ? "This meet is locked because you are not the organiser. Click to unlock it as an organisation admin."
    : "You cannot unlock this meet because you are not the organiser or an organisation admin.";

  return (
    <Tooltip title={text}>
      {canUnlock && onUnlock ? (
        <IconButton
          size="small"
          onClick={onUnlock}
          aria-label="Unlock meet"
          sx={{ color: "text.secondary", mr: -0.5 }}
        >
          <LockOutlinedIcon fontSize="small" />
        </IconButton>
      ) : (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "text.secondary",
            mr: -0.5,
          }}
          aria-label="Meet locked"
        >
          <LockOutlinedIcon fontSize="small" />
        </Box>
      )}
    </Tooltip>
  );
}
