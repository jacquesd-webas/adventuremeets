import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  Button,
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Alert,
  Checkbox,
  ButtonBase,
  LinearProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSnackbar } from "notistack";
import { useNotifyAttendee } from "../../hooks/useNotifyAttendee";
import { useDefaultMessage } from "../../hooks/useDefaultMessage";
import Meet from "../../types/MeetModel";
import AttendeeStatusEnum from "../../types/AttendeeStatusEnum";

type MessageModalProps = {
  open: boolean;
  onClose: () => void;
  meet?: Meet | null;
  attendeeIds?: string[];
  attendees?: {
    id: string;
    status?: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    respondedAt?: string | null;
  }[];
  defaultSubject?: string;
  defaultBody?: string;
  includeStatusUrl?: boolean;
};

function isConfirmedAttendeeStatus(status?: string) {
  return (
    status === AttendeeStatusEnum.Confirmed ||
    status === AttendeeStatusEnum.CheckedIn ||
    status === AttendeeStatusEnum.Attended
  );
}

function getBulkAutoMessageGroups({
  attendees,
  includeInvited,
  includeConfirmed,
  includeWaitlisted,
  includeRejected,
  invitedDefault,
  confirmedDefault,
  waitlistedDefault,
  rejectedDefault,
}: {
  attendees?: MessageModalProps["attendees"];
  includeInvited: boolean;
  includeConfirmed: boolean;
  includeWaitlisted: boolean;
  includeRejected: boolean;
  invitedDefault: { subject: string; content: string };
  confirmedDefault: { subject: string; content: string };
  waitlistedDefault: { subject: string; content: string };
  rejectedDefault: { subject: string; content: string };
}) {
  const groups: {
    attendeeIds: string[];
    subject: string;
    text: string;
  }[] = [];

  if (includeInvited) {
    const attendeeIds =
      attendees
        ?.filter((attendee) => attendee.status === AttendeeStatusEnum.Invited)
        .map((attendee) => attendee.id) ?? [];

    if (
      attendeeIds.length &&
      invitedDefault.subject.trim() &&
      invitedDefault.content.trim()
    ) {
      groups.push({
        attendeeIds,
        subject: invitedDefault.subject,
        text: invitedDefault.content,
      });
    }
  }

  if (includeConfirmed) {
    const attendeeIds =
      attendees
        ?.filter((attendee) => isConfirmedAttendeeStatus(attendee.status))
        .map((attendee) => attendee.id) ?? [];

    if (
      attendeeIds.length &&
      confirmedDefault.subject.trim() &&
      confirmedDefault.content.trim()
    ) {
      groups.push({
        attendeeIds,
        subject: confirmedDefault.subject,
        text: confirmedDefault.content,
      });
    }
  }

  if (includeWaitlisted) {
    const attendeeIds =
      attendees
        ?.filter(
          (attendee) => attendee.status === AttendeeStatusEnum.Waitlisted,
        )
        .map((attendee) => attendee.id) ?? [];

    if (
      attendeeIds.length &&
      waitlistedDefault.subject.trim() &&
      waitlistedDefault.content.trim()
    ) {
      groups.push({
        attendeeIds,
        subject: waitlistedDefault.subject,
        text: waitlistedDefault.content,
      });
    }
  }

  if (includeRejected) {
    const attendeeIds =
      attendees
        ?.filter((attendee) => attendee.status === AttendeeStatusEnum.Rejected)
        .map((attendee) => attendee.id) ?? [];

    if (
      attendeeIds.length &&
      rejectedDefault.subject.trim() &&
      rejectedDefault.content.trim()
    ) {
      groups.push({
        attendeeIds,
        subject: rejectedDefault.subject,
        text: rejectedDefault.content,
      });
    }
  }

  return groups;
}

export function MessageModal({
  open,
  onClose,
  meet,
  attendeeIds,
  attendees,
  defaultSubject = "",
  defaultBody = "",
  includeStatusUrl = true,
}: MessageModalProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const { enqueueSnackbar } = useSnackbar();
  const { notifyAttendeeAsync, isLoading } = useNotifyAttendee();
  const fallbackSubject = useMemo(
    () => defaultSubject || meet?.name || "",
    [defaultSubject, meet?.name],
  );
  const [subject, setSubject] = useState(fallbackSubject);
  const [body, setBody] = useState(defaultBody);
  const [autoResponse, setAutoResponse] = useState(false);
  const [manualSubject, setManualSubject] = useState(fallbackSubject);
  const [manualBody, setManualBody] = useState(defaultBody);
  const [error, setError] = useState<string | null>(null);
  const [markAsNotified, setMarkAsNotified] = useState(false);
  const [sendAsGroup, setSendAsGroup] = useState(false);
  const [showGroupHelp, setShowGroupHelp] = useState(false);
  const [showNotifiedHelp, setShowNotifiedHelp] = useState(false);
  const [includeConfirmed, setIncludeConfirmed] = useState(true);
  const [includeInvited, setIncludeInvited] = useState(false);
  const [includeWaitlisted, setIncludeWaitlisted] = useState(false);
  const [includeRejected, setIncludeRejected] = useState(false);
  const [sendProgress, setSendProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const markAsNotifiedRef = useRef<HTMLDivElement | null>(null);
  const isSending = sendProgress !== null;

  const attendeeStatus =
    attendeeIds && attendeeIds.length === 1
      ? (attendees?.find((att) => att.id === attendeeIds[0])
          ?.status as AttendeeStatusEnum)
      : undefined;

  const defaultMessageOptions = useMemo(
    () => ({
      meetName: meet?.name,
      confirmMessage: meet?.confirmMessage,
      waitlistMessage: meet?.waitlistMessage,
      rejectMessage: meet?.rejectMessage,
    }),
    [
      meet?.name,
      meet?.confirmMessage,
      meet?.waitlistMessage,
      meet?.rejectMessage,
    ],
  );
  const singleAttendeeDefault = useDefaultMessage(
    attendeeStatus,
    defaultMessageOptions,
  );
  const invitedDefault = useDefaultMessage(
    AttendeeStatusEnum.Invited,
    defaultMessageOptions,
  );
  const confirmedDefault = useDefaultMessage(
    AttendeeStatusEnum.Confirmed,
    defaultMessageOptions,
  );
  const waitlistedDefault = useDefaultMessage(
    AttendeeStatusEnum.Waitlisted,
    defaultMessageOptions,
  );
  const rejectedDefault = useDefaultMessage(
    AttendeeStatusEnum.Rejected,
    defaultMessageOptions,
  );
  const { subject: defaultAutoSubject, content: defaultAutoContent } =
    useMemo(() => {
      if (attendeeIds && attendeeIds.length === 1) {
        return singleAttendeeDefault;
      }

      const selectedDefaults = [];
      if (includeInvited)
        selectedDefaults.push({ label: "Invited", ...invitedDefault });
      if (includeConfirmed)
        selectedDefaults.push({ label: "Confirmed", ...confirmedDefault });
      if (includeWaitlisted)
        selectedDefaults.push({ label: "Waitlisted", ...waitlistedDefault });
      if (includeRejected)
        selectedDefaults.push({ label: "Rejected", ...rejectedDefault });
      const availableDefaults = selectedDefaults.filter(
        (item) => item.subject.trim() && item.content.trim(),
      );

      if (availableDefaults.length === 1) {
        return {
          subject: availableDefaults[0].subject,
          content: availableDefaults[0].content,
        };
      }

      if (availableDefaults.length > 1) {
        return {
          subject: "Meet attendance update",
          content: availableDefaults
            .map((item) => `${item.label} attendees:\n${item.content}`)
            .join("\n\n"),
        };
      }

      return { subject: "", content: "" };
    }, [
      attendeeIds,
      includeInvited,
      includeConfirmed,
      includeRejected,
      includeWaitlisted,
      singleAttendeeDefault,
      invitedDefault,
      confirmedDefault,
      waitlistedDefault,
      rejectedDefault,
    ]);
  const hasInvitedAttendees = useMemo(
    () =>
      Boolean(
        attendees?.some(
          (attendee) => attendee.status === AttendeeStatusEnum.Invited,
        ),
      ),
    [attendees],
  );
  const selectedAttendees = useMemo(() => {
    if (!attendees?.length) return [];
    if (attendeeIds && attendeeIds.length) {
      return attendees.filter((att) => attendeeIds.includes(att.id));
    }
    return attendees.filter((att) => {
      const status = att.status as AttendeeStatusEnum;
      if (includeInvited && status === AttendeeStatusEnum.Invited) return true;
      if (includeConfirmed && isConfirmedAttendeeStatus(status)) return true;
      if (includeWaitlisted && status === AttendeeStatusEnum.Waitlisted)
        return true;
      if (includeRejected && status === AttendeeStatusEnum.Rejected)
        return true;
      return false;
    });
  }, [
    attendees,
    attendeeIds,
    includeInvited,
    includeConfirmed,
    includeWaitlisted,
    includeRejected,
  ]);
  const hasUnnotified = selectedAttendees.some(
    (attendee) => !attendee.respondedAt,
  );

  useEffect(() => {
    if (autoResponse) {
      setSubject(defaultAutoSubject);
      setBody(defaultAutoContent);
    }
  }, [
    autoResponse,
    attendeeIds,
    attendeeStatus,
    defaultAutoSubject,
    defaultAutoContent,
    includeInvited,
    includeConfirmed,
    includeWaitlisted,
    includeRejected,
    selectedAttendees,
  ]);

  useEffect(() => {
    if (!open) return;
    setSubject((current) => current || fallbackSubject);
    setManualSubject((current) => current || fallbackSubject);
  }, [open, fallbackSubject]);

  useEffect(() => {
    if (!open || autoResponse || !hasUnnotified) return;
    if (typeof markAsNotifiedRef.current?.scrollIntoView === "function") {
      markAsNotifiedRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [open, autoResponse, hasUnnotified]);

  const reset = () => {
    setSubject(fallbackSubject);
    setBody(defaultBody);
    setAutoResponse(false);
    setManualSubject(fallbackSubject);
    setManualBody(defaultBody);
    setError(null);
    setMarkAsNotified(false);
    setSendAsGroup(false);
    setShowGroupHelp(false);
    setShowNotifiedHelp(false);
    setIncludeConfirmed(true);
    setIncludeInvited(false);
    setIncludeWaitlisted(false);
    setIncludeRejected(false);
    setSendProgress(null);
  };

  const handleSend = async () => {
    const resolvedSubject = subject.trim() || meet?.name?.trim() || "";
    if (!meet?.id) {
      setError("Subject, message and meet ID are required");
      return;
    }
    if (
      (!autoResponse || (attendeeIds && attendeeIds.length > 0)) &&
      (!resolvedSubject || !body.trim())
    ) {
      setError("Subject, message and meet ID are required");
      return;
    }
    const ids =
      attendeeIds && attendeeIds.length
        ? attendeeIds
        : (attendees || [])
            .filter((att) => {
              const status = att.status as AttendeeStatusEnum;
              if (includeInvited && status === AttendeeStatusEnum.Invited)
                return true;
              if (includeConfirmed && isConfirmedAttendeeStatus(status))
                return true;
              if (includeWaitlisted && status === AttendeeStatusEnum.Waitlisted)
                return true;
              if (includeRejected && status === AttendeeStatusEnum.Rejected)
                return true;
              return false;
            })
            .map((att) => att.id);
    if ((!attendeeIds || attendeeIds.length === 0) && ids.length === 0) {
      setError("Select at least one recipient group");
      return;
    }
    if (
      (!attendeeIds || attendeeIds.length === 0) &&
      !includeInvited &&
      !includeConfirmed &&
      !includeWaitlisted &&
      !includeRejected
    ) {
      setError("Select at least one recipient group");
      return;
    }
    setError(null);
    try {
      const jobs: {
        attendeeIds: string[];
        subject: string;
        text: string;
        markNotified: boolean;
        includeStatusUrl: boolean;
        sendAsGroup: boolean;
      }[] = [];

      if (autoResponse && (!attendeeIds || attendeeIds.length === 0)) {
        const autoGroups = getBulkAutoMessageGroups({
          attendees,
          includeInvited,
          includeConfirmed,
          includeWaitlisted,
          includeRejected,
          invitedDefault,
          confirmedDefault,
          waitlistedDefault,
          rejectedDefault,
        });

        if (autoGroups.length === 0) {
          setError("No automatic message could be generated for the selection");
          return;
        }

        if (sendAsGroup) {
          jobs.push(
            ...autoGroups.map((group) => ({
              subject: group.subject,
              text: group.text,
              attendeeIds: group.attendeeIds,
              markNotified: true,
              includeStatusUrl,
              sendAsGroup,
            })),
          );
        } else {
          jobs.push(
            ...autoGroups.flatMap((group) =>
              group.attendeeIds.map((attendeeId) => ({
                attendeeIds: [attendeeId],
                subject: group.subject,
                text: group.text,
                markNotified: true,
                includeStatusUrl,
                sendAsGroup: false,
              })),
            ),
          );
        }
      } else if (
        !sendAsGroup &&
        (!attendeeIds || attendeeIds.length === 0) &&
        ids.length > 1
      ) {
        jobs.push(
          ...ids.map((attendeeId) => ({
            attendeeIds: [attendeeId],
            subject: resolvedSubject,
            text: body,
            markNotified: autoResponse || markAsNotified,
            includeStatusUrl,
            sendAsGroup: false,
          })),
        );
      } else {
        jobs.push({
          attendeeIds: ids.length ? ids : [],
          subject: resolvedSubject,
          text: body,
          markNotified: autoResponse || markAsNotified,
          includeStatusUrl,
          sendAsGroup,
        });
      }

      setSendProgress({ completed: 0, total: jobs.length });

      await Promise.all(
        jobs.map(async (job) => {
          await notifyAttendeeAsync({
            meetId: meet.id,
            subject: job.subject,
            text: job.text,
            attendeeIds: job.attendeeIds.length ? job.attendeeIds : undefined,
            markNotified: job.markNotified,
            includeStatusUrl: job.includeStatusUrl,
            sendAsGroup: job.sendAsGroup,
          });

          setSendProgress((current) =>
            current
              ? {
                  ...current,
                  completed: current.completed + 1,
                }
              : current,
          );
        }),
      );
      enqueueSnackbar("Message sent", {
        variant: "success",
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
      });
      onClose();
      reset();
    } catch (err: any) {
      setSendProgress(null);
      setError(err?.message || "Failed to send message");
    }
  };

  const progressPercent = sendProgress
    ? (sendProgress.completed / sendProgress.total) * 100
    : 0;

  return (
    <Dialog
      open={open}
      onClose={isSending ? () => undefined : onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={fullScreen}
    >
      <DialogTitle>
        {isSending ? "Sending messages" : "Send message"}
      </DialogTitle>
      <DialogContent>
        {isSending ? (
          <Stack spacing={2} sx={{ mt: 2, mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Sent {sendProgress.completed} of {sendProgress.total} messages
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              sx={{ height: 10, borderRadius: 999 }}
            />
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && (
              <span style={{ color: "#d32f2f", fontSize: 14, fontWeight: 600 }}>
                {error}
              </span>
            )}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TextField
                label="Subject"
                fullWidth
                size="small"
                value={subject}
                onChange={(e) => {
                  const value = e.target.value;
                  setSubject(value);
                  if (!autoResponse) {
                    setManualSubject(value);
                  }
                }}
                disabled={autoResponse}
              />
              <FormControlLabel
                label={<Typography variant="body2">Auto</Typography>}
                control={
                  <Switch
                    checked={autoResponse}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setAutoResponse(checked);
                      setMarkAsNotified(checked);
                      if (checked) {
                        setManualSubject(subject);
                        setManualBody(body);
                        setSubject(defaultAutoSubject);
                        setBody(defaultAutoContent);
                      } else {
                        setSubject(manualSubject);
                        setBody(manualBody);
                      }
                    }}
                  />
                }
                sx={{ m: 0, whiteSpace: "nowrap" }}
              />
            </Box>
            <TextField
              label="Message"
              fullWidth
              multiline
              minRows={4}
              value={body}
              onChange={(e) => {
                const value = e.target.value;
                setBody(value);
                if (!autoResponse) {
                  setManualBody(value);
                }
              }}
              disabled={autoResponse}
            />
            <Stack direction="column" spacing={1}>
              {!attendeeIds && (
                <>
                  <Typography variant="subtitle2" color="text.secondary">
                    Who should we send the message to?
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      columnGap: 2,
                      rowGap: 0.5,
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={includeConfirmed}
                          onChange={(e) =>
                            setIncludeConfirmed(e.target.checked)
                          }
                        />
                      }
                      label="Confirmed"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={includeWaitlisted}
                          onChange={(e) =>
                            setIncludeWaitlisted(e.target.checked)
                          }
                        />
                      }
                      label="Waitlisted"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={includeRejected}
                          onChange={(e) => setIncludeRejected(e.target.checked)}
                        />
                      }
                      label="Rejected"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={includeInvited}
                          onChange={(e) => setIncludeInvited(e.target.checked)}
                          disabled={!hasInvitedAttendees}
                        />
                      }
                      label="Invited"
                    />
                  </Box>
                  <Box
                    ref={markAsNotifiedRef}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={sendAsGroup}
                          onChange={(e) => setSendAsGroup(e.target.checked)}
                        />
                      }
                      label="Send as a group message"
                      sx={{ mr: 0 }}
                    />
                    <ButtonBase
                      aria-label="What is this?"
                      onClick={() => setShowGroupHelp((current) => !current)}
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.5,
                        color: "info.main",
                        typography: "body2",
                      }}
                    >
                      <HelpOutlineIcon fontSize="small" />
                      <span>What is this?</span>
                    </ButtonBase>
                  </Box>
                  {showGroupHelp ? (
                    <Alert severity="info">
                      Group messages send one email to all the selected
                      attendees to start a group email thread. All attendees
                      will see each-other's email addresses and no meet link
                      will be added.
                    </Alert>
                  ) : sendAsGroup ? (
                    <Alert severity="warning">
                      <strong>Note:</strong> E-mail addresses will be shared
                      with the group.
                    </Alert>
                  ) : null}
                </>
              )}
              {hasUnnotified && !autoResponse && (
                <>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={autoResponse || markAsNotified}
                          onChange={(e) => setMarkAsNotified(e.target.checked)}
                          disabled={autoResponse}
                        />
                      }
                      label="Mark attendee(s) as notified"
                      sx={{ mr: 0 }}
                    />
                    <ButtonBase
                      aria-label="What is this?"
                      onClick={() => setShowNotifiedHelp((current) => !current)}
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.5,
                        color: "info.main",
                        typography: "body2",
                      }}
                    >
                      <HelpOutlineIcon fontSize="small" />
                      <span>What is this?</span>
                    </ButtonBase>
                  </Box>
                  {showNotifiedHelp && (
                    <Alert severity="info">
                      Manual messages do not mark attendees as notified of their
                      status. Use the Auto switch to send one of your meet
                      status responses, or mark them as notified below if this
                      message serves as an update of their status.
                    </Alert>
                  )}
                </>
              )}
            </Stack>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={
            isSending ||
            isLoading ||
            (!attendeeIds &&
              !includeInvited &&
              !includeConfirmed &&
              !includeWaitlisted &&
              !includeRejected)
          }
        >
          {isSending || isLoading ? "Sending..." : "Send"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
