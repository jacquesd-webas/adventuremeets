import { Alert, Box, Container, Paper, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import formatRange from "../helpers/formatRange";

type AttendeeStatusResponse = {
  meet: {
    id: string;
    name: string;
    location?: string;
    startTime?: string;
    endTime?: string;
    imageUrl?: string;
  };
  attendee: {
    id: string;
    name?: string | null;
    status?: string | null;
    guests?: number | null;
    email?: string | null;
    phone?: string | null;
  };
};

const attendeeStatusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  waitlisted: "Waitlisted",
  canceled: "Cancelled",
  "checked-in": "Checked in",
  attended: "Attended",
};

function getStatusLabel(status?: string | null) {
  if (!status) return "Pending";
  return attendeeStatusLabels[status] || status;
}

export default function AttendeeStatus() {
  const { shareId, attendeeId } = useParams<{
    shareId: string;
    attendeeId: string;
  }>();
  const api = useApi();
  const query = useQuery({
    queryKey: ["attendee-status", shareId, attendeeId],
    queryFn: async () => {
      if (!shareId || !attendeeId) return null;
      return api.get<AttendeeStatusResponse>(
        `/meets/${shareId}/${attendeeId}`
      );
    },
    enabled: Boolean(shareId && attendeeId),
  });

  if (query.isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography color="text.secondary">Loading attendee status...</Typography>
      </Container>
    );
  }

  if (query.error || !query.data) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error">Unable to load attendee status.</Alert>
      </Container>
    );
  }

  const { meet, attendee } = query.data;
  const timeLabel = formatRange(meet.startTime, meet.endTime);

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {meet.name}
            </Typography>
            {meet.location && (
              <Typography variant="body2" color="text.secondary">
                {meet.location}
              </Typography>
            )}
            {timeLabel && (
              <Typography variant="body2" color="text.secondary">
                {timeLabel}
              </Typography>
            )}
          </Box>

          <Box>
            <Typography variant="subtitle2" fontWeight={700}>
              Attendee
            </Typography>
            <Typography variant="body1">
              {attendee.name || attendee.email || attendee.phone || "Attendee"}
            </Typography>
            {typeof attendee.guests === "number" && attendee.guests > 0 ? (
              <Typography variant="body2" color="text.secondary">
                Guests: {attendee.guests}
              </Typography>
            ) : null}
          </Box>

          <Alert severity="info">
            Status: {getStatusLabel(attendee.status)}
          </Alert>
        </Stack>
      </Paper>
    </Container>
  );
}
