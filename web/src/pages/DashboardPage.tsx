import { ReactNode, useMemo, useState } from "react";
import { Box, Button, Container, Grid, Paper, Stack, Typography, Chip } from "@mui/material";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import HistoryIcon from "@mui/icons-material/History";
import PlaceIcon from "@mui/icons-material/Place";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { Heading } from "../components/Heading";
import { CreateMeetModal } from "../components/createMeetModal/CreateMeetModal";
import { useFetchMeets } from "../hooks/useFetchMeets";
import { useMeetStatusLookup } from "../hooks/useFetchMeetStatuses";
import { ManageAttendeesModal } from "../components/manageAttendeesModal";
import { ReportsModal } from "../components/reportsModal";
import { MeetActionsMenu } from "../components/MeetActionsMenu";
import {
  ConfirmCancelMeetDialog,
  ConfirmCloseMeetDialog,
  ConfirmDeleteMeetDialog,
  ConfirmOpenMeetDialog,
  ConfirmPostponeMeetDialog
} from "../components/confirmActions";
import { useUpdateMeetStatus } from "../hooks/useUpdateMeetStatus";
import { useApi } from "../hooks/useApi";
import { useNavigate } from "react-router-dom";

type Meet = {
  id: string;
  name: string;
  location: string;
  start_time: string;
  end_time: string;
  status_id?: number;
  attendeeCount?: number;
  waitlistCount?: number;
  confirmedCount?: number;
};

function formatRange(start?: string, end?: string) {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "";
  return `${s.toLocaleDateString()} • ${s.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${e.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function MeetCard({
  meet,
  statusLabel,
  onClick,
  actions
}: {
  meet: Meet;
  statusLabel: string;
  onClick: () => void;
  actions?: ReactNode;
}) {
  const isUpcoming = new Date(meet.end_time) >= new Date();
  const rangeLabel = formatRange(meet.start_time, meet.end_time);
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, cursor: "pointer" }}
      onClick={onClick}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        {isUpcoming ? <EventAvailableIcon color="primary" /> : <HistoryIcon color="action" />}
        <Typography variant="h6" sx={{ flex: 1 }}>
          {meet.name}
        </Typography>
        <Chip label={statusLabel} color={isUpcoming ? "primary" : "default"} size="small" />
        {actions ? <Box sx={{ ml: 0.5 }}>{actions}</Box> : null}
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center" mt={1}>
        <PlaceIcon fontSize="small" color="disabled" />
        <Typography variant="body2">{meet.location}</Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center" mt={1}>
        <AccessTimeIcon fontSize="small" color="disabled" />
        {rangeLabel ? <Typography variant="body2">{rangeLabel}</Typography> : null}
      </Stack>
      {isUpcoming ? (
        <Stack direction="row" spacing={2} alignItems="center" mt={1.5}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <GroupOutlinedIcon fontSize="small" color="primary" />
            <Typography variant="body2" fontWeight={600}>
              {meet.attendeeCount ?? 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              applicants
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <GroupOutlinedIcon fontSize="small" color="disabled" />
            <Typography variant="body2" fontWeight={600}>
              {meet.waitlistCount ?? 0}
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
              {meet.confirmedCount ?? 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              confirmed
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <GroupOutlinedIcon fontSize="small" color="disabled" />
            <Typography variant="body2" fontWeight={600}>
              {meet.attendeeCount ?? 0}
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
  const [showMeetModal, setShowMeetModal] = useState(false);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [selectedMeetId, setSelectedMeetId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    type: "open" | "postpone" | "close" | "cancel" | "delete";
    meetId: string;
  } | null>(null);
  const { data: meets, isLoading, refetch } = useFetchMeets({ view: "all", page: 1, limit: 50 });
  const { getName: getStatusName } = useMeetStatusLookup();
  const { updateStatusAsync, isLoading: isUpdatingStatus } = useUpdateMeetStatus();
  const api = useApi();
  const navigate = useNavigate();
  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const visibleMeets = meets.filter((m) => m.status_id !== 1);
    const upcomingMeets = visibleMeets.filter((m) => new Date(m.end_time) >= now);
    const pastMeets = visibleMeets.filter((m) => new Date(m.end_time) < now);
    return { upcoming: upcomingMeets, past: pastMeets };
  }, [meets]);
  const handleCardAction = (meet: any) => {
    const statusId = meet?.status_id;
    setSelectedMeetId(meet.id);
    if (statusId === 1 || statusId === 6) {
      setShowMeetModal(true);
      return;
    }
    if (statusId === 2 || statusId === 3) {
      setShowAttendeesModal(true);
      return;
    }
    if (statusId === 4 || statusId === 5 || statusId === 7) {
      setShowReportsModal(true);
    }
  };

  return (
    <Container
      maxWidth="md"
      sx={{ pt: 1, pb: 4, height: "calc(100vh - 64px)", display: "flex", flexDirection: "column" }}
    >
      <Heading
        title="Dashboard"
        subtitle="View upcoming and past meets that you are organising."
        actionComponent={
          <Button
            variant="contained"
            onClick={() => {
              setSelectedMeetId(null);
              setShowMeetModal(true);
            }}
          >
            New Meet
          </Button>
        }
      />

      <Box sx={{ flex: 1, overflowY: "auto", pr: 1 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Upcoming Meets
            </Typography>
            <Stack spacing={2}>
              {isLoading ? (
                <Typography variant="body2" color="text.secondary">
                  Loading meets...
                </Typography>
              ) : upcoming.length ? (
                upcoming.map((meet) => (
                  <MeetCard
                    key={meet.id}
                    meet={meet as Meet}
                    statusLabel={getStatusName(meet.status_id, "Scheduled")}
                    onClick={() => handleCardAction(meet)}
                    actions={
                      <MeetActionsMenu
                        meetId={meet.id}
                        statusId={(meet as any).status_id}
                        onEdit={() => {
                          setSelectedMeetId(meet.id);
                          setShowMeetModal(true);
                        }}
                        onPreview={() =>
                          navigate(`/meets/${(meet as any).share_code || meet.id}?preview=true`)
                        }
                        onAttendees={() => {
                          setSelectedMeetId(meet.id);
                          setShowAttendeesModal(true);
                        }}
                        onReports={() => {
                          setSelectedMeetId(meet.id);
                          setShowReportsModal(true);
                        }}
                        onCheckin={() => navigate(`/meet/${meet.id}/checkin`)}
                        onOpen={() => setPendingAction({ type: "open", meetId: meet.id })}
                        onPostpone={() => setPendingAction({ type: "postpone", meetId: meet.id })}
                        onCloseMeet={() => setPendingAction({ type: "close", meetId: meet.id })}
                        onDelete={() =>
                          setPendingAction({
                            type: (meet as any).status_id === 1 ? "delete" : "cancel",
                            meetId: meet.id
                          })
                        }
                      />
                    }
                  />
                ))
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
              {isLoading ? (
                <Typography variant="body2" color="text.secondary">
                  Loading meets...
                </Typography>
              ) : past.length ? (
                past.map((meet) => (
                  <MeetCard
                    key={meet.id}
                    meet={meet as Meet}
                    statusLabel={getStatusName(meet.status_id, "Closed")}
                    onClick={() => handleCardAction(meet)}
                    actions={
                      <MeetActionsMenu
                        meetId={meet.id}
                        statusId={(meet as any).status_id}
                        onEdit={() => {
                          setSelectedMeetId(meet.id);
                          setShowMeetModal(true);
                        }}
                        onPreview={() =>
                          navigate(`/meets/${(meet as any).share_code || meet.id}?preview=true`)
                        }
                        onAttendees={() => {
                          setSelectedMeetId(meet.id);
                          setShowAttendeesModal(true);
                        }}
                        onReports={() => {
                          setSelectedMeetId(meet.id);
                          setShowReportsModal(true);
                        }}
                        onCheckin={() => navigate(`/meet/${meet.id}/checkin`)}
                        onOpen={() => setPendingAction({ type: "open", meetId: meet.id })}
                        onPostpone={() => setPendingAction({ type: "postpone", meetId: meet.id })}
                        onCloseMeet={() => setPendingAction({ type: "close", meetId: meet.id })}
                        onDelete={() =>
                          setPendingAction({
                            type: (meet as any).status_id === 1 ? "delete" : "cancel",
                            meetId: meet.id
                          })
                        }
                      />
                    }
                  />
                ))
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
      </Box>
      <CreateMeetModal
        open={showMeetModal}
        meetId={selectedMeetId}
        onClose={() => {
          setShowMeetModal(false);
          setSelectedMeetId(null);
        }}
        onCreated={() => refetch()}
      />
      <ManageAttendeesModal
        open={showAttendeesModal}
        meetId={selectedMeetId}
        onClose={() => {
          setShowAttendeesModal(false);
          setSelectedMeetId(null);
        }}
      />
      <ReportsModal
        open={showReportsModal}
        meetId={selectedMeetId}
        onClose={() => {
          setShowReportsModal(false);
          setSelectedMeetId(null);
        }}
      />
      <ConfirmOpenMeetDialog
        open={pendingAction?.type === "open"}
        onClose={() => setPendingAction(null)}
        onConfirm={async () => {
          if (!pendingAction) return;
          await updateStatusAsync({ meetId: pendingAction.meetId, statusId: 3 });
          setPendingAction(null);
          await refetch();
        }}
        isLoading={isUpdatingStatus}
      />
      <ConfirmPostponeMeetDialog
        open={pendingAction?.type === "postpone"}
        onClose={() => setPendingAction(null)}
        onConfirm={async (_message) => {
          if (!pendingAction) return;
          await updateStatusAsync({ meetId: pendingAction.meetId, statusId: 6 });
          setPendingAction(null);
          await refetch();
        }}
        isLoading={isUpdatingStatus}
      />
      <ConfirmCloseMeetDialog
        open={pendingAction?.type === "close"}
        onClose={() => setPendingAction(null)}
        onConfirm={async () => {
          if (!pendingAction) return;
          await updateStatusAsync({ meetId: pendingAction.meetId, statusId: 4 });
          setPendingAction(null);
          await refetch();
        }}
        isLoading={isUpdatingStatus}
      />
      <ConfirmCancelMeetDialog
        open={pendingAction?.type === "cancel"}
        onClose={() => setPendingAction(null)}
        onConfirm={async () => {
          if (!pendingAction) return;
          await updateStatusAsync({ meetId: pendingAction.meetId, statusId: 5 });
          setPendingAction(null);
          await refetch();
        }}
        isLoading={isUpdatingStatus}
      />
      <ConfirmDeleteMeetDialog
        open={pendingAction?.type === "delete"}
        onClose={() => setPendingAction(null)}
        onConfirm={async () => {
          if (!pendingAction) return;
          await api.del(`/meets/${pendingAction.meetId}`);
          setPendingAction(null);
          await refetch();
        }}
        isLoading={isUpdatingStatus}
      />
    </Container>
  );
}

export default DashboardPage;
