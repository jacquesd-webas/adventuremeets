import { Alert, Stack, Typography } from "@mui/material";

type AttendeeStatusAlertProps = {
  status?: string | null;
};

const statusMeta: Record<
  string,
  { label: string; severity: "success" | "info" | "warning" | "error" }
> = {
  pending: { label: "Pending", severity: "info" },
  confirmed: { label: "Confirmed", severity: "success" },
  waitlisted: { label: "Waitlisted", severity: "warning" },
  canceled: { label: "Cancelled", severity: "info" },
  rejected: { label: "Not selected", severity: "warning" },
  "checked-in": { label: "Checked in", severity: "success" },
  attended: { label: "Attended", severity: "success" },
};

export function AttendeeStatusAlert({ status }: AttendeeStatusAlertProps) {
  const meta = statusMeta[status || "pending"] || {
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
