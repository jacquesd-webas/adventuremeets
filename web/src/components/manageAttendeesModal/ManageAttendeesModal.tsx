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
import { OrganizerMetaEditDialog } from "./OrganizerMetaEditDialog";
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
    null,
  );
  const [showEditMetaDialog, setShowEditMetaDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<AttendeeStatusEnum | null>(
    null,
  );
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageAttendeeIds, setMessageAttendeeIds] = useState<
    string[] | undefined
  >(undefined);
  const [detailView, setDetailView] = useState<"responses" | "messages">(
    "responses",
  );
  const { data: attendeeMessages } = useFetchAttendeeMessages(
    meetId,
    selectedAttendeeId,
  );
  const hasUnreadMessages = useMemo(
    () => (attendeeMessages || []).some((message) => !message.isRead),
    [attendeeMessages],
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
    [attendees, selectedAttendeeId],
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
    if (!meetId || !selectedAttendeeId || !selectedAttendee) return;
    if (!meet?.costCents && !meet?.depositCents) return;
    setIsUpdating(true);
    try {
      const now = new Date().toISOString();
      const hasDeposit = Boolean(selectedAttendee.paidDepositAt);
      const hasFull = Boolean(selectedAttendee.paidFullAt);
      const canUseDeposit = Boolean(meet?.depositCents);
      let paidFullAt: string | null | undefined = undefined;
      let paidDepositAt: string | null | undefined = undefined;

      if (!canUseDeposit) {
        paidFullAt = hasFull ? null : now;
        paidDepositAt = hasFull ? null : undefined;
      } else {
        if (hasFull) {
          paidFullAt = null;
          paidDepositAt = null;
        } else if (hasDeposit) {
          paidFullAt = now;
          paidDepositAt = undefined;
        } else {
          paidDepositAt = now;
          paidFullAt = undefined;
        }
      }
      await updateMeetAttendeeAsync({
        meetId,
        attendeeId: selectedAttendeeId,
        paidFullAt,
        paidDepositAt,
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
      { accepted: 0, rejected: 0, waitlisted: 0 },
    );
  }, [attendees]);

  // TODO: Refactor this component into smaller components
  const isOrganizerSelected = Boolean(
    selectedAttendee && meet && selectedAttendee.userId === meet.organizerId,
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      fullScreen={fullScreen}
      sx={{
        "& .MuiDialog-paper": {
          mt: 10,
          minHeight: "85vh",
        },
      }}
    >
      <DialogTitle>Manage attendees</DialogTitle>
      <DialogContent
        sx={{
          pb: 2,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{
            minHeight: 360,
            height: "100%",
            flex: 1,
          }}
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
                  const paidLabel = attendee.paidFullAt
                    ? "Paid"
                    : attendee.paidDepositAt
                      ? "Dep"
                      : null;
                  const paidColor = attendee.paidFullAt
                    ? "info.main"
                    : "secondary.main";
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
                            position: "relative",
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
                          {paidLabel ? (
                            <Box
                              component="span"
                              sx={{
                                position: "absolute",
                                top: -4,
                                right: -6,
                                px: 0.5,
                                borderRadius: 999,
                                border: "1px solid",
                                borderColor: paidColor,
                                color: paidColor,
                                bgcolor: "background.paper",
                                fontSize: 9,
                                lineHeight: 1.2,
                                fontWeight: 700,
                                letterSpacing: 0.2,
                              }}
                            >
                              {paidLabel}
                            </Box>
                          ) : null}
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
                      {isOrganizerSelected ? (
                        <Button variant="outlined" disabled>
                          Organiser
                        </Button>
                      ) : (
                        <AttendeeActionButtons
                          attendee={selectedAttendee}
                          onUpdateStatus={handleUpdateStatus}
                          onPaid={handleAttendeePaid}
                          hasAmount={Boolean(meet?.costCents)}
                          hasDeposit={Boolean(meet?.depositCents)}
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
                        showEdit={false}
                        onInfoClick={() => setDetailView("responses")}
                        onMailClick={() => setDetailView("messages")}
                        onEditClick={undefined}
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
                  {isOrganizerSelected ? (
                    detailView === "messages" ? (
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setMessageAttendeeIds(
                            selectedAttendee
                              ? [selectedAttendee.id]
                              : undefined,
                          );
                          setMessageOpen(true);
                        }}
                      >
                        Message {attendeeLabel(selectedAttendee)}
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        onClick={() => setShowEditMetaDialog(true)}
                      >
                        Edit responses
                      </Button>
                    )
                  ) : (
                    <Button
                      variant="outlined"
                      disabled={!selectedAttendee}
                      onClick={() => {
                        setMessageAttendeeIds(
                          selectedAttendee ? [selectedAttendee.id] : undefined,
                        );
                        setMessageOpen(true);
                      }}
                    >
                      Message {attendeeLabel(selectedAttendee)}
                    </Button>
                  )}
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
      {selectedAttendee && meet && meetId && (
        <OrganizerMetaEditDialog
          open={showEditMetaDialog}
          onClose={() => setShowEditMetaDialog(false)}
          meetId={meetId}
          attendeeId={selectedAttendee.id}
          metaValues={selectedAttendee.metaValues || []}
        />
      )}
    </Dialog>
  );
}
