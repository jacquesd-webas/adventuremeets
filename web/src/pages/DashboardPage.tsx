import { useMemo } from "react";
import { Box, Button, Container, Grid, Paper, Stack, Typography, Chip } from "@mui/material";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import HistoryIcon from "@mui/icons-material/History";
import PlaceIcon from "@mui/icons-material/Place";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { Heading } from "../components/Heading";

type Meet = {
  id: string;
  name: string;
  location: string;
  start: string;
  end: string;
  status: "Scheduled" | "Completed";
  applicants?: number;
  waitlist?: number;
  confirmed?: number;
  attended?: number;
};

const sampleMeets: Meet[] = [
  {
    id: "1",
    name: "Product Kickoff",
    location: "HQ Boardroom",
    start: "2025-12-02T10:00:00Z",
    end: "2025-12-02T11:00:00Z",
    status: "Scheduled",
    applicants: 12,
    waitlist: 2
  },
  {
    id: "2",
    name: "Design Review",
    location: "Zoom",
    start: "2025-12-04T15:00:00Z",
    end: "2025-12-04T16:00:00Z",
    status: "Scheduled",
    applicants: 8,
    waitlist: 0
  },
  {
    id: "3",
    name: "Quarterly Retro",
    location: "Offsite",
    start: "2025-11-10T13:00:00Z",
    end: "2025-11-10T15:00:00Z",
    status: "Completed",
    confirmed: 22,
    attended: 19
  }
];

function formatRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString()} • ${s.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${e.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function MeetCard({ meet }: { meet: Meet }) {
  const isUpcoming = meet.status === "Scheduled";
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        {isUpcoming ? <EventAvailableIcon color="primary" /> : <HistoryIcon color="action" />}
        <Typography variant="h6" sx={{ flex: 1 }}>
          {meet.name}
        </Typography>
        <Chip label={meet.status} color={isUpcoming ? "primary" : "default"} size="small" />
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center" mt={1}>
        <PlaceIcon fontSize="small" color="disabled" />
        <Typography variant="body2">{meet.location}</Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center" mt={1}>
        <AccessTimeIcon fontSize="small" color="disabled" />
        <Typography variant="body2">{formatRange(meet.start, meet.end)}</Typography>
      </Stack>
      {isUpcoming ? (
        <Stack direction="row" spacing={2} alignItems="center" mt={1.5}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <GroupOutlinedIcon fontSize="small" color="primary" />
            <Typography variant="body2" fontWeight={600}>
              {meet.applicants ?? 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              applicants
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <GroupOutlinedIcon fontSize="small" color="disabled" />
            <Typography variant="body2" fontWeight={600}>
              {meet.waitlist ?? 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              waitlist
            </Typography>
          </Stack>
        </Stack>
      ) : (
        <Stack direction="row" spacing={2} alignItems="center" mt={1.5}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <CheckCircleOutlineIcon fontSize="small" color="primary" />
            <Typography variant="body2" fontWeight={600}>
              {meet.confirmed ?? 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              confirmed
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <GroupOutlinedIcon fontSize="small" color="disabled" />
            <Typography variant="body2" fontWeight={600}>
              {meet.attended ?? 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              attended
            </Typography>
          </Stack>
        </Stack>
      )}
    </Paper>
  );
}

function DashboardPage() {
  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const upcomingMeets = sampleMeets.filter((m) => new Date(m.start) >= now);
    const pastMeets = sampleMeets.filter((m) => new Date(m.start) < now);
    return { upcoming: upcomingMeets, past: pastMeets };
  }, []);

  return (
    <Container maxWidth="md" sx={{ pt: 1, pb: 4 }}>
      <Heading
        title="Dashboard"
        subtitle="View upcoming and past meets that you are organising."
        actionComponent={<Button variant="contained">New Meet</Button>}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Upcoming Meets
          </Typography>
          <Stack spacing={2}>
            {upcoming.length ? (
              upcoming.map((meet) => <MeetCard key={meet.id} meet={meet} />)
            ) : (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  No upcoming meets scheduled.
                </Typography>
              </Paper>
            )}
          </Stack>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Past Meets
          </Typography>
          <Stack spacing={2}>
            {past.length ? (
              past.map((meet) => <MeetCard key={meet.id} meet={meet} />)
            ) : (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  No past meets yet.
                </Typography>
              </Paper>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}

export default DashboardPage;
