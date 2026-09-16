import { Stack, Tooltip, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import type { AttendeeMessage } from "../../hooks/useFetchAttendeeMessages";

export function EmailDeliveryStatus({
  status,
}: {
  status: AttendeeMessage["emailStatus"];
}) {
  // Deal with the failed and bounced statuses first
  if (status === "failed" || status === "bounced") {
    const label = status === "bounced" ? "Bounced" : "Failed to send";
    const tooltipText =
      status === "bounced"
        ? "The email could not be delivered to the attendee. This is usually because the email address is invalid or the attendee's mail server rejected it."
        : "The email could not be sent due to a problem with the mail server.";
    return (
      <Tooltip title={tooltipText} arrow>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <CancelOutlinedIcon
            titleAccess={label}
            sx={{ fontSize: "1rem", color: "error.main" }}
          />
        </Stack>
      </Tooltip>
    );
  }
  // Ignore statuses that are not definitive
  if (status !== "sent" && status !== "delivered" && status !== "opened")
    return null;

  // Remaining statuses are all positive
  const label = status === "opened" ? "Delivered" : "Sent";
  const tooltipText =
    status === "opened"
      ? "The attendee's mail program has accessed the email, so it can be considered delivered."
      : "The email has successfully been sent to the attendee. We do not know if they have read it, as some mail programs block tracking.";
  return (
    <Tooltip title={tooltipText} arrow>
      <Stack direction="row" spacing={0.75} alignItems="center">
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <CheckCircleOutlineIcon
          titleAccess={label}
          sx={{
            fontSize: "1rem",
            color: status === "opened" ? "#1976d2" : "text.disabled",
          }}
        />
      </Stack>
    </Tooltip>
  );
}
