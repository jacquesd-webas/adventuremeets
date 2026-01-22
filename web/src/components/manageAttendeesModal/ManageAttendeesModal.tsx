import {
  Avatar,
  Box,
  Button,
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
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useFetchMeetAttendees } from "../../hooks/useFetchMeetAttendees";
import { useApi } from "../../hooks/useApi";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import { MessageModal } from "./MessageModal";
import { ConfirmClosedStatusDialog } from "./ConfirmClosedStatusDialog";
import Meet from "../../types/MeetModel";
import { AttendeeActionButtons } from "./AttendeeActionButtons";

type ManageAttendeesModalProps = {
  open: boolean;
  onClose: () => void;
  meetId?: string | null;
  meet?: Meet | null;
};

export function ManageAttendeesModal({
  open,
  onClose,
  meetId,
  meet,
}: ManageAttendeesModalProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const {
    data: attendees,
    isLoading,
    refetch,
  } = useFetchMeetAttendees(meetId, open);
  const api = useApi();
  const [selectedAttendeeId, setSelectedAttendeeId] = useState<string | null>(
    null
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [meetStatus, setMeetStatus] = useState<number | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [meetName, setMeetName] = useState<string | null>(null);
  const [meetDetails, setMeetDetails] = useState<Meet | null>(null);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageAttendeeIds, setMessageAttendeeIds] = useState<
    string[] | undefined
  >(undefined);

  useEffect(() => {
    if (!open) {
      setSelectedAttendeeId(null);
      return;
    }
    if (
      attendees.length &&
      !attendees.some((attendee) => attendee.id === selectedAttendeeId)
    ) {
      setSelectedAttendeeId(attendees[0].id);
    }
  }, [attendees, open, selectedAttendeeId]);

  useEffect(() => {
    if (!open || (!meetId && !meet)) {
      return;
    }

    if (meet) {
      const statusVal =
        typeof meet.statusId !== "undefined" ? meet.statusId : null;
      const statusNum =
        typeof statusVal === "number"
          ? statusVal
          : statusVal != null
          ? Number(statusVal)
          : null;
      setMeetStatus(!Number.isNaN(statusNum || NaN) ? statusNum : null);
      setMeetName(meet?.name || null);
      setMeetDetails(meet);
      return;
    }

    let isActive = true;
    api
      .get(`/meets/${meetId}`)
      .then((m: any) => {
        if (!isActive) return;
        const statusVal =
          typeof m?.statusId !== "undefined" ? m.statusId : null;
        const statusNum =
          typeof statusVal === "number"
            ? statusVal
            : statusVal != null
            ? Number(statusVal)
            : null;
        setMeetStatus(!Number.isNaN(statusNum || NaN) ? statusNum : null);
        setMeetName(m?.name || null);
        setMeetDetails(m || null);
      })
      .catch(() => {
        if (!isActive) return;
        setMeetStatus(null);
        setMeetDetails(null);
      });
    return () => {
      isActive = false;
    };
  }, [api, meet, meetId, open]);

  const selectedAttendee = useMemo(
    () =>
      attendees.find((attendee) => attendee.id === selectedAttendeeId) || null,
    [attendees, selectedAttendeeId]
  );
  const attendeeLabel = (attendee: any) =>
    attendee?.name || attendee?.email || attendee?.phone || "Unnamed attendee";
  const applyStatus = async (status: string) => {
    if (!meetId || !selectedAttendeeId) return;
    setIsUpdating(true);
    try {
      await api.patch(`/meets/${meetId}/attendees/${selectedAttendeeId}`, {
        status,
      });
      await refetch();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateStatus = (status: string) => {
    const isClosed = meetStatus === 4; // Closed status id
    if (isClosed) {
      setPendingStatus(status);
      setConfirmDialog(true);
      return;
    }
    applyStatus(status);
  };
  const statusCounts = useMemo(() => {
    return attendees.reduce(
      (acc, attendee) => {
        const status = attendee.status || "pending";
        if (status === "confirmed") acc.accepted += 1;
        if (status === "rejected") acc.rejected += 1;
        if (status === "waitlisted") acc.waitlisted += 1;
        return acc;
      },
      { accepted: 0, rejected: 0, waitlisted: 0 }
    );
  }, [attendees]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      fullScreen={fullScreen}
    >
      <DialogTitle>Manage attendees</DialogTitle>
      <DialogContent sx={{ pb: 2 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ minHeight: 360 }}
        >
          <Paper
            variant="outlined"
            sx={{ width: { xs: "100%", md: 280 }, flexShrink: 0 }}
          >
            <Box sx={{ p: 2 }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  Attendees
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip
                    size="small"
                    color="success"
                    label={statusCounts.accepted}
                  />
                  <Chip
                    size="small"
                    color="error"
                    label={statusCounts.rejected}
                  />
                  <Chip
                    size="small"
                    color="warning"
                    label={statusCounts.waitlisted}
                  />
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
                  const isRejected = attendee.status === "rejected";
                  const isWaitlisted = attendee.status === "waitlisted";
                  return (
                    <ListItemButton
                      key={attendee.id}
                      selected={attendee.id === selectedAttendeeId}
                      onClick={() => setSelectedAttendeeId(attendee.id)}
                    >
                      {isConfirmed || isRejected || isWaitlisted ? (
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            mr: 1.5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {isConfirmed ? (
                            <CheckCircleOutlineIcon
                              fontSize="large"
                              color="success"
                            />
                          ) : isWaitlisted ? (
                            <CheckCircleOutlineIcon
                              fontSize="large"
                              color="warning"
                            />
                          ) : (
                            <CancelOutlinedIcon
                              fontSize="large"
                              color="error"
                            />
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
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Typography variant="h6">
                      {attendeeLabel(selectedAttendee)}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <AttendeeActionButtons
                        attendee={selectedAttendee}
                        onUpdateStatus={handleUpdateStatus}
                      />
                    </Stack>
                  </Stack>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    mt={1}
                    flexWrap="wrap"
                  >
                    {selectedAttendee.email ? (
                      <Chip size="small" label={selectedAttendee.email} />
                    ) : null}
                    {selectedAttendee.phone ? (
                      <Chip size="small" label={selectedAttendee.phone} />
                    ) : null}
                    {selectedAttendee.guests ? (
                      <Chip
                        size="small"
                        label={`Guests: ${selectedAttendee.guests}`}
                      />
                    ) : null}
                  </Stack>
                </Box>
                <Divider />
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Indemnity
                  </Typography>
                  <Typography variant="body2">
                    {selectedAttendee.indemnityAccepted
                      ? "Accepted"
                      : "Not accepted"}
                  </Typography>
                  {selectedAttendee.indemnityMinors ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Minors: {selectedAttendee.indemnityMinors}
                    </Typography>
                  ) : null}
                </Box>
                <Divider />
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
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
                <Box>
                  <Button
                    variant="outlined"
                    disabled={!selectedAttendee}
                    onClick={() => {
                      setMessageAttendeeIds(
                        selectedAttendee ? [selectedAttendee.id] : undefined
                      );
                      setMessageOpen(true);
                    }}
                  >
                    Message {attendeeLabel(selectedAttendee)}
                  </Button>
                </Box>
              </Stack>
            )}
          </Paper>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Box sx={{ flex: 1, display: "flex", justifyContent: "left" }}>
          <Button
            variant="outlined"
            onClick={() => {
              setMessageAttendeeIds(undefined);
              setMessageOpen(true);
            }}
          >
            Send Message to All Attendees
          </Button>
        </Box>
        <Button variant="contained" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
      {meetId && (
        <MessageModal
          open={messageOpen}
          onClose={() => setMessageOpen(false)}
          meetId={meetId}
          meet={meetDetails}
          attendeeIds={messageAttendeeIds}
          attendees={attendees}
        />
      )}
      <ConfirmClosedStatusDialog
        open={confirmDialog}
        status={pendingStatus}
        meet={meetDetails || { id: meetId, name: meetName }}
        attendee={attendees.find((a) => a.id === selectedAttendeeId)!}
        onClose={() => {
          setConfirmDialog(false);
          setPendingStatus(null);
          setIsUpdating(false);
        }}
        onDone={async () => {
          setConfirmDialog(false);
          setPendingStatus(null);
          setIsUpdating(false);
          await refetch();
        }}
      />
    </Dialog>
  );
}
