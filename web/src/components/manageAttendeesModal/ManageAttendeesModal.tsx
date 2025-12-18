import {
  Avatar,
  Box,
  Button,
  ButtonGroup,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useFetchMeetAttendees } from "../../hooks/useFetchMeetAttendees";
import { useApi } from "../../hooks/useApi";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

type ManageAttendeesModalProps = {
  open: boolean;
  onClose: () => void;
  meetId?: string | null;
};

export function ManageAttendeesModal({ open, onClose, meetId }: ManageAttendeesModalProps) {
  const { data: attendees, isLoading, refetch } = useFetchMeetAttendees(meetId, open);
  const api = useApi();
  const [selectedAttendeeId, setSelectedAttendeeId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [waitlistSize, setWaitlistSize] = useState<number | null>(null);

  useEffect(() => {
    if (!open) {
      setSelectedAttendeeId(null);
      return;
    }
    if (attendees.length && !attendees.some((attendee) => attendee.id === selectedAttendeeId)) {
      setSelectedAttendeeId(attendees[0].id);
    }
  }, [attendees, open, selectedAttendeeId]);

  useEffect(() => {
    if (!open || !meetId) {
      setWaitlistSize(null);
      return;
    }
    let isActive = true;
    api
      .get(`/meets/${meetId}`)
      .then((meet: any) => {
        if (!isActive) return;
        const size = meet?.waitlistSize ?? meet?.waitlist_size ?? 0;
        setWaitlistSize(Number(size) || 0);
      })
      .catch(() => {
        if (!isActive) return;
        setWaitlistSize(0);
      });
    return () => {
      isActive = false;
    };
  }, [api, meetId, open]);

  const selectedAttendee = useMemo(
    () => attendees.find((attendee) => attendee.id === selectedAttendeeId) || null,
    [attendees, selectedAttendeeId]
  );
  const attendeeLabel = (attendee: any) =>
    attendee?.name || attendee?.email || attendee?.phone || "Unnamed attendee";
  const handleUpdateStatus = async (status: string) => {
    if (!meetId || !selectedAttendeeId) return;
    setIsUpdating(true);
    try {
      await api.patch(`/meets/${meetId}/attendees/${selectedAttendeeId}`, { status });
      await refetch();
    } finally {
      setIsUpdating(false);
    }
  };
  const statusCounts = useMemo(() => {
    return attendees.reduce(
      (acc, attendee) => {
        const status = attendee.status || "pending";
        if (status === "confirmed") acc.accepted += 1;
        if (status === "canceled") acc.rejected += 1;
        if (status === "waitlisted") acc.waitlisted += 1;
        return acc;
      },
      { accepted: 0, rejected: 0, waitlisted: 0 }
    );
  }, [attendees]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Manage attendees</DialogTitle>
      <DialogContent sx={{ pb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ minHeight: 360 }}>
          <Paper variant="outlined" sx={{ width: { xs: "100%", md: 280 }, flexShrink: 0 }}>
            <Box sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  Attendees
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip size="small" color="success" label={statusCounts.accepted} />
                  <Chip size="small" color="error" label={statusCounts.rejected} />
                  <Chip size="small" color="warning" label={statusCounts.waitlisted} />
                </Stack>
              </Stack>
            </Box>
            <Divider />
            <List sx={{ maxHeight: { xs: 220, md: 420 }, overflowY: "auto" }}>
              {isLoading ? (
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Loading attendees...
                  </Typography>
                </Box>
              ) : attendees.length ? (
                attendees.map((attendee) => {
                  const label = attendeeLabel(attendee);
                  const subLabel = attendee.email || attendee.phone || "";
                  const isConfirmed = attendee.status === "confirmed";
                  const isRejected = attendee.status === "canceled";
                  const isWaitlisted = attendee.status === "waitlisted";
                  return (
                    <ListItemButton
                      key={attendee.id}
                      selected={attendee.id === selectedAttendeeId}
                      onClick={() => setSelectedAttendeeId(attendee.id)}
                    >
                      {isConfirmed || isRejected || isWaitlisted ? (
                        <Box sx={{ width: 32, height: 32, mr: 1.5, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {isConfirmed ? (
                            <CheckCircleOutlineIcon fontSize="large" color="success" />
                          ) : isWaitlisted ? (
                            <CheckCircleOutlineIcon fontSize="large" color="warning" />
                          ) : (
                            <CancelOutlinedIcon fontSize="large" color="error" />
                          )}
                        </Box>
                      ) : (
                        <Avatar sx={{ width: 32, height: 32, mr: 1.5 }}>
                          {label.slice(0, 1).toUpperCase()}
                        </Avatar>
                      )}
                      <ListItemText
                        primary={label}
                        secondary={subLabel}
                        primaryTypographyProps={{ fontWeight: 600 }}
                      />
                    </ListItemButton>
                  );
                })
              ) : (
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    No attendees yet.
                  </Typography>
                </Box>
              )}
            </List>
          </Paper>
          <Paper variant="outlined" sx={{ flex: 1, p: 2 }}>
            {!selectedAttendee ? (
              <Typography variant="body2" color="text.secondary">
                Select an attendee to view their details.
              </Typography>
            ) : (
              <Stack spacing={2}>
                <Box>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                    <Typography variant="h6">{attendeeLabel(selectedAttendee)}</Typography>
                    <Stack direction="row" spacing={1}>
                      <ButtonGroup
                        variant="outlined"
                        size="small"
                        disabled={!selectedAttendee || isUpdating}
                        aria-label="Update attendee status"
                      >
                        <Button color="success" onClick={() => handleUpdateStatus("confirmed")}>
                          Accept
                        </Button>
                        <Button color="error" onClick={() => handleUpdateStatus("canceled")}>
                          Reject
                        </Button>
                        <Button color="warning" onClick={() => handleUpdateStatus("waitlisted")}>
                          Waitlist
                        </Button>
                      </ButtonGroup>
                    </Stack>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center" mt={1} flexWrap="wrap">
                    {selectedAttendee.email ? <Chip size="small" label={selectedAttendee.email} /> : null}
                    {selectedAttendee.phone ? <Chip size="small" label={selectedAttendee.phone} /> : null}
                    {selectedAttendee.guests ? <Chip size="small" label={`Guests: ${selectedAttendee.guests}`} /> : null}
                  </Stack>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Indemnity
                  </Typography>
                  <Typography variant="body2">
                    {selectedAttendee.indemnity_accepted ? "Accepted" : "Not accepted"}
                  </Typography>
                  {selectedAttendee.indemnity_minors ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Minors: {selectedAttendee.indemnity_minors}
                    </Typography>
                  ) : null}
                </Box>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Responses
                  </Typography>
                  {selectedAttendee.metaValues?.length ? (
                    <Stack spacing={1}>
                      {selectedAttendee.metaValues.map((response) => (
                        <Box key={response.definitionId}>
                          <Typography variant="caption" color="text.secondary">
                            {response.label}
                          </Typography>
                          <Typography variant="body2">
                            {response.value || "—"}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No responses available.
                    </Typography>
                  )}
                </Box>
              </Stack>
            )}
          </Paper>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
