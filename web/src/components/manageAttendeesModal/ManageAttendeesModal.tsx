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
import QuestionMarkOutlinedIcon from "@mui/icons-material/QuestionMarkOutlined";
import SupervisorAccountOutlinedIcon from "@mui/icons-material/SupervisorAccountOutlined";
import { MessageModal } from "./MessageModal";
import { ConfirmClosedStatusDialog } from "./ConfirmClosedStatusDialog";
import Meet from "../../types/MeetModel";
import { AttendeeActionButtons } from "./AttendeeActionButtons";
import { DetailSelector } from "./DetailSelector";
import { AttendeeResponses } from "./AttendeeResponses";
import { AttendeeMessages } from "./AttendeeMessages";
import MeetStatusEnum from "../../types/MeetStatusEnum";
import AttendeeStatusEnum from "../../types/AttendeeStatusEnum";
import { useFetchAttendeeMessages } from "../../hooks/useFetchAttendeeMessages";

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
  } = useFetchMeetAttendees(meetId, open ? "all" : null);
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
  const [detailView, setDetailView] = useState<"responses" | "messages">(
    "responses"
  );
  const { data: attendeeMessages } = useFetchAttendeeMessages(
    meetId,
    selectedAttendeeId
  );
  const hasUnreadMessages = useMemo(
    () => (attendeeMessages || []).some((message) => !message.isRead),
    [attendeeMessages]
  );

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
    setDetailView("responses");
  }, [selectedAttendeeId]);

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
        const status = attendee.status || AttendeeStatusEnum.Pending;
        if (status === AttendeeStatusEnum.Confirmed) acc.accepted += 1;
        if (
          status === AttendeeStatusEnum.Rejected ||
          status === AttendeeStatusEnum.Cancelled
        )
          acc.rejected += 1;
        if (status === AttendeeStatusEnum.Waitlisted) acc.waitlisted += 1;
        return acc;
      },
      { accepted: 0, rejected: 0, waitlisted: 0 }
    );
  }, [attendees]);

  // TODO: Refactor this component into smaller components

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
                  const isConfirmed =
                    attendee.status === AttendeeStatusEnum.Confirmed ||
                    attendee.status === AttendeeStatusEnum.Attended ||
                    attendee.status === AttendeeStatusEnum.CheckedIn;
                  const isRejected =
                    attendee.status === AttendeeStatusEnum.Rejected ||
                    attendee.status === AttendeeStatusEnum.Cancelled;
                  const isPending =
                    attendee.status === AttendeeStatusEnum.Pending;
                  const isWaitlisted =
                    attendee.status === AttendeeStatusEnum.Waitlisted;
                  const isOrganizer =
                    attendee && meet && attendee.userId === meet.organizerId;
                  return (
                    <ListItemButton
                      key={attendee.id}
                      selected={attendee.id === selectedAttendeeId}
                      onClick={() => setSelectedAttendeeId(attendee.id)}
                    >
                      {!isPending ? (
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
                          {isOrganizer ? (
                            <SupervisorAccountOutlinedIcon
                              fontSize="large"
                              color="primary"
                            />
                          ) : isConfirmed ? (
                            <CheckCircleOutlineIcon
                              fontSize="large"
                              color="success"
                            />
                          ) : isWaitlisted ? (
                            <CheckCircleOutlineIcon
                              fontSize="large"
                              color="warning"
                            />
                          ) : isRejected ? (
                            <CancelOutlinedIcon
                              fontSize="large"
                              color="error"
                            />
                          ) : (
                            <QuestionMarkOutlinedIcon
                              fontSize="large"
                              color="disabled"
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
                      {selectedAttendee &&
                      meet &&
                      selectedAttendee.userId === meet.organizerId ? (
                        <Button variant="outlined" disabled>
                          Organiser
                        </Button>
                      ) : (
                        <AttendeeActionButtons
                          attendee={selectedAttendee}
                          onUpdateStatus={handleUpdateStatus}
                          onPaid={
                            meet?.costCents ? handleAttendeePaid : undefined
                          }
                        />
                      )}
                    </Stack>
                  </Stack>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mt: 1,
                    }}
                  >
                    <Stack direction="row" spacing={1} flexWrap="wrap">
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
                    <Box sx={{ ml: "auto" }}>
                      <DetailSelector
                        disabled={!selectedAttendee}
                        active={detailView === "messages" ? "mail" : "info"}
                        showUnread={hasUnreadMessages}
                        onInfoClick={() => setDetailView("responses")}
                        onMailClick={() => setDetailView("messages")}
                      />
                    </Box>
                  </Box>
                </Box>
                <Divider />
                {detailView === "messages" ? (
                  <AttendeeMessages
                    meetId={meetId}
                    attendeeId={selectedAttendee?.id}
                    attendeeEmail={selectedAttendee?.email}
                  />
                ) : (
                  <AttendeeResponses
                    indemnityAccepted={selectedAttendee.indemnityAccepted}
                    indemnityMinors={selectedAttendee.indemnityMinors}
                    responses={selectedAttendee.metaValues}
                  />
                )}
                <Divider />
                <Box sx={{ display: "flex", justifyContent: "center" }}>
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
