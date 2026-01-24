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
  CircularProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useFetchMeetAttendees } from "../../hooks/useFetchMeetAttendees";
import { useFetchMeet } from "../../hooks/useFetchMeet";
import { useUpdateMeetAttendee } from "../../hooks/useUpdateMeetAttendee";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import { MessageModal } from "./MessageModal";
import { ConfirmClosedStatusDialog } from "./ConfirmClosedStatusDialog";
import Meet from "../../types/MeetModel";
import { AttendeeActionButtons } from "./AttendeeActionButtons";
import MeetStatusEnum from "../../types/MeetStatusEnum";
import { A } from "vitest/dist/reporters-5f784f42";
import AttendeeStatusEnum from "../../types/AttendeeStatusEnum";

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
}: ManageAttendeesModalProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const {
    data: attendees,
    isLoading,
    refetch,
  } = useFetchMeetAttendees(meetId, open);
  const { data: meet } = useFetchMeet(meetId, Boolean(open && meetId));
  const { updateMeetAttendeeAsync } = useUpdateMeetAttendee();
  const [selectedAttendeeId, setSelectedAttendeeId] = useState<string | null>(
    null
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<AttendeeStatusEnum | null>(
    null
  );
  const [confirmDialog, setConfirmDialog] = useState(false);
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

  const meetStatus = useMemo(() => {
    const statusVal =
      typeof meet?.statusId !== "undefined" ? meet.statusId : null;
    const statusNum =
      typeof statusVal === "number"
        ? statusVal
        : statusVal != null
        ? Number(statusVal)
        : null;
    return !Number.isNaN(statusNum || NaN) ? statusNum : null;
  }, [meet]);

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
      await updateMeetAttendeeAsync({
        meetId,
        attendeeId: selectedAttendeeId,
        status,
      });
      await refetch();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAttendeePaid = async () => {
    if (!meetId || !selectedAttendeeId) return;
    setIsUpdating(true);
    try {
      await updateMeetAttendeeAsync({
        meetId,
        attendeeId: selectedAttendeeId,
        paidFullAt: new Date().toISOString(),
      });
      await refetch();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateStatus = (status: AttendeeStatusEnum) => {
    const isClosed = meetStatus === MeetStatusEnum.Closed;
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
                    <Stack direction="row" spacing={1} alignItems="center">
                      {isUpdating && <CircularProgress size={18} />}
                      <AttendeeActionButtons
                        attendee={selectedAttendee}
                        onUpdateStatus={handleUpdateStatus}
                        onPaid={
                          meet?.costCents ? handleAttendeePaid : undefined
                        }
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
      {meet && (
        <MessageModal
          open={messageOpen}
          onClose={() => setMessageOpen(false)}
          meetId={meet.id}
          meet={meet}
          attendeeIds={messageAttendeeIds}
          attendees={attendees}
        />
      )}
      {meet && (
        <ConfirmClosedStatusDialog
          open={confirmDialog}
          status={pendingStatus}
          meet={meet}
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
      )}
    </Dialog>
  );
}
