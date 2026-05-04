import { Box, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { useFetchAttendeeHistory } from "../../hooks/useFetchAttendeeHistory";
import AttendeeStatusEnum from "../../types/AttendeeStatusEnum";

type AttendeeHistoryProps = {
  attendeeId?: string | null;
  meetId?: string | null;
};

const statusMeta: Record<
  string,
  {
    label: string;
    color: "default" | "success" | "warning" | "error" | "info";
  }
> = {
  [AttendeeStatusEnum.Pending]: { label: "Pending", color: "info" },
  [AttendeeStatusEnum.Invited]: { label: "Invited", color: "info" },
  [AttendeeStatusEnum.Confirmed]: { label: "Confirmed", color: "success" },
  [AttendeeStatusEnum.Waitlisted]: { label: "Waitlisted", color: "warning" },
  [AttendeeStatusEnum.Cancelled]: { label: "Cancelled", color: "error" },
  [AttendeeStatusEnum.Rejected]: { label: "Not selected", color: "warning" },
  [AttendeeStatusEnum.CheckedIn]: { label: "Checked in", color: "success" },
  [AttendeeStatusEnum.Attended]: { label: "Attended", color: "success" },
  [AttendeeStatusEnum.NoShow]: { label: "No show", color: "error" },
};

function formatHistoryDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function AttendeeHistory({ attendeeId, meetId }: AttendeeHistoryProps) {
  const { data, isLoading, error } = useFetchAttendeeHistory(
    attendeeId,
    meetId,
  );

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Meet Attendance
      </Typography>

      {!attendeeId ? (
        <Typography variant="body2" color="text.secondary">
          Select an attendee to view their history.
        </Typography>
      ) : isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
          <CircularProgress size={22} />
        </Box>
      ) : error ? (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      ) : data.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No other meets found.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {data.map((item) => {
            const meta = statusMeta[item.attendeeStatus] || {
              label: item.attendeeStatus || "Unknown",
              color: "default" as const,
            };

            return (
              <Box key={`${item.meetId}-${item.date}`}>
                <Stack
                  direction={{ xs: "row", sm: "row" }}
                  justifyContent="space-between"
                  spacing={1}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                >
                  <Box sx={{ minWidth: "90px" }}>
                    <Typography variant="caption" color="text.secondary">
                      {formatHistoryDate(item.date)}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption">{item.meetName}</Typography>
                  </Box>
                  <Chip
                    label={meta.label}
                    color={meta.color}
                    size="small"
                    sx={{ fontSize: "0.75rem" }}
                  />
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
