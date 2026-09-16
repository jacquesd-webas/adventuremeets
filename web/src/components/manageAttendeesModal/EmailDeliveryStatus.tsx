import { Stack, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import type { AttendeeMessage } from "../../hooks/useFetchAttendeeMessages";

export function EmailDeliveryStatus({ status }: { status: AttendeeMessage["emailStatus"] }) {
  if (status === "failed" || status === "bounced") {
    const label = status === "bounced" ? "Bounced" : "Failed to send";
    return (
      <Stack direction="row" spacing={0.75} alignItems="center">
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <CancelOutlinedIcon titleAccess={label} sx={{ fontSize: "1rem", color: "error.main" }} />
      </Stack>
    );
  }
  if (status !== "sent" && status !== "delivered" && status !== "opened") return null;
  const label = status === "opened" ? "Opened" : "Sent";
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <CheckCircleOutlineIcon
        titleAccess={label}
        sx={{ fontSize: "1rem", color: status === "opened" ? "#1976d2" : "text.disabled" }}
      />
    </Stack>
  );
}
