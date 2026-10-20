import { Paper, Stack, Typography } from "@mui/material";
import type { AttendeeAuditLog } from "../../hooks/useFetchAttendeeMessages";

export function AttendeeAuditEntry({ log }: { log: AttendeeAuditLog }) {
  const description = log.description.replace(
    /\s+(?:for|from) meet\s+.+$/i,
    "",
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        px: 2,
        py: 1.5,
        bgcolor: (theme) =>
          theme.palette.mode === "dark"
            ? theme.palette.grey[800]
            : theme.palette.grey[100],
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography variant="body2" fontStyle="italic" sx={{ minWidth: 0 }}>
          {description}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ flexShrink: 0 }}
        >
          {new Date(log.timestamp).toLocaleString()}
        </Typography>
      </Stack>
    </Paper>
  );
}
