import { Box, Tooltip } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

type LockedMeetProps = {
  canUnlock?: boolean;
};

export function LockedMeet({ canUnlock }: LockedMeetProps) {
  // In the future we may wish to allow admins to unlock meets
  const text = canUnlock
    ? "Unlocking of meets you did not create has been disabled for this organisation."
    : "You cannot unlock this meet because you are not the organiser.";

  return (
    <Tooltip title={text}>
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
    </Tooltip>
  );
}
