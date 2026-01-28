import { Alert, Box } from "@mui/material";
import { MeetStatus } from "../constants/meetStatus";
import { formatFriendlyTimestamp } from "../helpers/formatFriendlyTimestamp";

type MeetStatusAlertProps = {
  statusId?: number;
  openingDate?: string;
  size?: "default" | "small";
};

export function MeetStatusAlert({
  statusId,
  openingDate,
  size = "default",
}: MeetStatusAlertProps) {
  let text = "";
  let severity: "info" | "warning" | "error" = "info";

  if (statusId === MeetStatus.Published) {
    const openLabel = openingDate ? formatFriendlyTimestamp(openingDate) : "";
    text = openLabel
      ? `This meet is not yet open for bookings. Booking opens ${openLabel}.`
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
        {text}
      </Alert>
    </Box>
  );
}
