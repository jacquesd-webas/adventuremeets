import { Alert, Box, Button, Typography } from "@mui/material";
import { MeetStatus } from "../constants/meetStatus";
import { formatFriendlyTimestamp } from "../helpers/formatFriendlyTimestamp";
import { useNavigate } from "react-router-dom";

type MeetStatusAlertProps = {
  statusId?: number;
  openingDate?: string;
  enableApply?: boolean;
  shareCode?: string;
  size?: "default" | "small";
};

export function MeetStatusAlert({
  statusId,
  openingDate,
  enableApply,
  shareCode,
  size = "default",
}: MeetStatusAlertProps) {
  const nav = useNavigate();
  let text = "";
  let severity: "info" | "warning" | "success" | "error" = "info";

  if (statusId === MeetStatus.Published) {
    const openLabel = openingDate ? formatFriendlyTimestamp(openingDate) : "";
    text = openLabel
      ? `This meet is not yet open for bookings. Bookings open ${openLabel}.`
      : "This meet is not yet open for bookings.";
    severity = "warning";
  } else if (statusId === MeetStatus.Closed) {
    text = "This meet is closed and no longer accepting bookings.";
    severity = "warning";
  } else if (statusId === MeetStatus.Cancelled) {
    text = "This meet has been cancelled.";
    severity = "error";
  } else if (statusId === MeetStatus.Postponed) {
    text = "This meet has been postponed. Please check back later for updates.";
    severity = "warning";
  } else if (statusId === MeetStatus.Completed) {
    text = "This meet has been archived and is no longer accepting bookings.";
    severity = "info";
  } else if (statusId === MeetStatus.Open && enableApply) {
    text = "This meet is open for bookings!";
    severity = "success";
  } else {
    return null;
  }

  return (
    <Box p={size === "small" ? 2.5 : 5}>
      <Alert
        severity={severity}
        icon={false}
        sx={{
          py: size === "small" ? 3 : 6,
          fontWeight: 700,
          textAlign: "center",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {enableApply && statusId === MeetStatus.Open ? (
          <>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {text}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ ml: 2 }}
              onClick={() => {
                nav(`/meets/${shareCode}`);
              }}
              disabled={!shareCode}
            >
              Apply Now
            </Button>
          </>
        ) : (
          <Typography variant="body1">{text}</Typography>
        )}
      </Alert>
    </Box>
  );
}
