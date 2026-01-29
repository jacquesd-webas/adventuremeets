import { Alert, Stack, Typography } from "@mui/material";
import AttendeeStatusEnum from "../types/AttendeeStatusEnum";

type AttendeeStatusAlertProps = {
  status?: string | null;
};

const statusMeta: Record<
  string,
  { label: string; severity: "success" | "info" | "warning" | "error" }
> = {
  [AttendeeStatusEnum.Pending]: { label: "Pending", severity: "info" },
  [AttendeeStatusEnum.Confirmed]: { label: "Confirmed", severity: "success" },
  [AttendeeStatusEnum.Waitlisted]: { label: "Waitlisted", severity: "warning" },
  [AttendeeStatusEnum.Cancelled]: { label: "Cancelled", severity: "error" },
  [AttendeeStatusEnum.Rejected]: { label: "Not selected", severity: "warning" },
  [AttendeeStatusEnum.CheckedIn]: { label: "Checked in", severity: "success" },
  [AttendeeStatusEnum.Attended]: { label: "Attended", severity: "success" },
};

export function AttendeeStatusAlert({ status }: AttendeeStatusAlertProps) {
  const meta = statusMeta[status || AttendeeStatusEnum.Pending] || {
    label: status || "Pending",
    severity: "info",
  };

  return (
    <Alert
      severity={meta.severity}
      variant="filled"
      icon={false}
      sx={{
        borderRadius: 2,
        py: 2.5,
        px: 3,
        "& .MuiAlert-message": { width: "100%" },
      }}
    >
      <Stack spacing={0.5} alignItems={{ xs: "flex-start", sm: "center" }}>
        <Typography variant="overline" sx={{ opacity: 0.8 }}>
          Your status
        </Typography>
        <Typography variant="h4" fontWeight={700}>
          {meta.label}
        </Typography>
      </Stack>
    </Alert>
  );
}
