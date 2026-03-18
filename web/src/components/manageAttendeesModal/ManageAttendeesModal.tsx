import {
  Box,
  Button,
  Chip,
  Drawer,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Alert,
  Checkbox,
  Tooltip,
  List,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useFetchMeetAttendees } from "../../hooks/useFetchMeetAttendees";
import { useFetchMeet } from "../../hooks/useFetchMeet";
import { useUpdateMeetAttendee } from "../../hooks/useUpdateMeetAttendee";
import { useNotifyAttendee } from "../../hooks/useNotifyAttendee";
import { useDefaultMessage } from "../../hooks/useDefaultMessage";
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { AttendeeItem } from "./AttendeeItem";
import { MessageModal } from "./MessageModal";
import { ConfirmClosedStatusDialog } from "./ConfirmClosedStatusDialog";
import Meet from "../../types/MeetModel";
import { AttendeeActionButtons } from "./AttendeeActionButtons";
import { DetailSelector } from "./DetailSelector";
import { AttendeeResponses } from "./AttendeeResponses";
import { AttendeeMessages } from "./AttendeeMessages";
import { OrganizerMetaEditDialog } from "./OrganizerMetaEditDialog";
import { AttendeesIndemnityInfo } from "./AttendeesIndemnityInfo";
import ConfirmActionDialog from "../ConfirmActionDialog";
import MeetStatusEnum from "../../types/MeetStatusEnum";
import AttendeeStatusEnum from "../../types/AttendeeStatusEnum";
import { useFetchAttendeeMessages } from "../../hooks/useFetchAttendeeMessages";
import { useSnackbar } from "notistack";
import { useQueryClient } from "@tanstack/react-query";
import { Attendee } from "../../types/AttendeeModel";

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
  const { notifyAttendeeAsync, isLoading: isMessageSending } =
    useNotifyAttendee();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [selectedAttendeeId, setSelectedAttendeeId] = useState<string | null>(
    null,
  );
  const [showEditMetaDialog, setShowEditMetaDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGuestsUpdating, setIsGuestsUpdating] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<AttendeeStatusEnum | null>(
    null,
  );
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [notifyBeforeCloseOpen, setNotifyBeforeCloseOpen] = useState(false);
  const [notifyBeforeCloseAttendees, setNotifyBeforeCloseAttendees] = useState<
    Attendee[]
  >([]);
  const [isNotifyingBeforeClose, setIsNotifyingBeforeClose] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageAttendeeIds, setMessageAttendeeIds] = useState<
    string[] | undefined
  >(undefined);
  const [messageModalDefaults, setMessageModalDefaults] = useState({
    subject: "",
    body: "",
    includeStatusUrl: true,
  });
  const [messageModalKey, setMessageModalKey] = useState(0);
  const [messageDrawerOpen, setMessageDrawerOpen] = useState(false);
  const [messageDrawerRecipientIds, setMessageDrawerRecipientIds] = useState<
    string[] | undefined
  >(undefined);
  const [messageDrawerSubject, setMessageDrawerSubject] = useState("");
  const [messageDrawerBody, setMessageDrawerBody] = useState("");
  const [messageDrawerAutoResponse, setMessageDrawerAutoResponse] =
    useState(false);
  const [messageDrawerManualSubject, setMessageDrawerManualSubject] =
    useState("");
  const [messageDrawerManualBody, setMessageDrawerManualBody] = useState("");
  const [messageDrawerMarkAsNotified, setMessageDrawerMarkAsNotified] =
    useState(false);
  const [messageDrawerIncludeStatusUrl, setMessageDrawerIncludeStatusUrl] =
    useState(true);
  const [messageDrawerError, setMessageDrawerError] = useState<string | null>(
    null,
  );
  const [messageDrawerIncludeConfirmed, setMessageDrawerIncludeConfirmed] =
    useState(true);
  const [messageDrawerIncludeWaitlisted, setMessageDrawerIncludeWaitlisted] =
    useState(false);
  const [messageDrawerIncludeRejected, setMessageDrawerIncludeRejected] =
    useState(false);
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
    const selectedIsValid = attendees.some(
      (attendee) => attendee.id === selectedAttendeeId,
    );
    if (fullScreen) {
      if (selectedAttendeeId && !selectedIsValid) {
        setSelectedAttendeeId(null);
      }
      return;
    }
    if (attendees.length && !selectedIsValid) {
      setSelectedAttendeeId(attendees[0].id);
    }
  }, [attendees, fullScreen, open, selectedAttendeeId]);

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
  const messageDrawerAttendee = useMemo(
    () =>
      messageDrawerRecipientIds && messageDrawerRecipientIds.length === 1
        ? attendees.find(
            (attendee) => attendee.id === messageDrawerRecipientIds[0],
          ) || null
        : null,
    [attendees, messageDrawerRecipientIds],
  );
  const attendeeLabel = (attendee: Attendee) =>
    attendee?.name || attendee?.email || attendee?.phone || "Unnamed attendee";
  const guestOfLabel = (attendee: Attendee) => {
    if (!attendee?.guestOf) return null;
    const host = attendees.find((person) => person.id === attendee.guestOf);
    return host ? attendeeLabel(host) : "Unknown attendee";
  };
  const mobileMessageDefault = useDefaultMessage(
    messageDrawerAttendee?.status as AttendeeStatusEnum | undefined,
    {
      meetName: meet?.name,
      confirmMessage: meet?.confirmMessage,
      waitlistMessage: meet?.waitlistMessage,
      rejectMessage: meet?.rejectMessage,
    },
  );
  const messageDrawerSelectedAttendees = useMemo(() => {
    if (!attendees?.length) return [];
    if (messageDrawerRecipientIds && messageDrawerRecipientIds.length) {
      return attendees.filter((att) =>
        messageDrawerRecipientIds.includes(att.id),
      );
    }
    return attendees.filter((att) => {
      const status = att.status as AttendeeStatusEnum;
      if (
        messageDrawerIncludeConfirmed &&
        [
          AttendeeStatusEnum.Confirmed,
          AttendeeStatusEnum.CheckedIn,
          AttendeeStatusEnum.Attended,
        ].includes(status)
      )
        return true;
      if (messageDrawerIncludeWaitlisted && status === AttendeeStatusEnum.Waitlisted)
        return true;
      if (
        messageDrawerIncludeRejected &&
        (status === AttendeeStatusEnum.Rejected ||
          status === AttendeeStatusEnum.Cancelled)
      )
        return true;
      return false;
    });
  }, [
    attendees,
    messageDrawerRecipientIds,
    messageDrawerIncludeConfirmed,
    messageDrawerIncludeWaitlisted,
    messageDrawerIncludeRejected,
  ]);
  const messageDrawerHasUnnotified = messageDrawerSelectedAttendees.some(
    (attendee) => !attendee.respondedAt,
  );
  const confirmedMessage = useDefaultMessage(AttendeeStatusEnum.Confirmed, {
    meetName: meet?.name,
    confirmMessage: meet?.confirmMessage,
    waitlistMessage: meet?.waitlistMessage,
    rejectMessage: meet?.rejectMessage,
  });
  const waitlistMessage = useDefaultMessage(AttendeeStatusEnum.Waitlisted, {
    meetName: meet?.name,
    confirmMessage: meet?.confirmMessage,
    waitlistMessage: meet?.waitlistMessage,
    rejectMessage: meet?.rejectMessage,
  });
  const rejectMessage = useDefaultMessage(AttendeeStatusEnum.Rejected, {
    meetName: meet?.name,
    confirmMessage: meet?.confirmMessage,
    waitlistMessage: meet?.waitlistMessage,
    rejectMessage: meet?.rejectMessage,
  });
  const getDefaultMessageForStatus = (status: AttendeeStatusEnum) => {
    if (
      status === AttendeeStatusEnum.CheckedIn ||
      status === AttendeeStatusEnum.Attended
    ) {
      return confirmedMessage;
    }
    if (
      status === AttendeeStatusEnum.Rejected ||
      status === AttendeeStatusEnum.Cancelled ||
      status === AttendeeStatusEnum.NoShow
    ) {
      return rejectMessage;
    }
    if (status === AttendeeStatusEnum.Waitlisted) {
      return waitlistMessage;
    }
    if (status === AttendeeStatusEnum.Confirmed) {
      return confirmedMessage;
    }
    return { subject: "", content: "" };
  };

  useEffect(() => {
    if (messageDrawerAutoResponse) {
      setMessageDrawerSubject(mobileMessageDefault.subject);
      setMessageDrawerBody(mobileMessageDefault.content);
    }
  }, [messageDrawerAutoResponse, mobileMessageDefault]);
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
  const handleGuestCountChange = async (delta: number) => {
    if (!meetId || !selectedAttendee) return;
    const current = selectedAttendee.guests ?? 0;
    const next = Math.max(0, current + delta);
    if (next === current) return;
    setIsGuestsUpdating(true);
    try {
      await updateMeetAttendeeAsync({
        meetId,
        attendeeId: selectedAttendee.id,
        guests: next,
      });
      await refetch();
    } finally {
      setIsGuestsUpdating(false);
    }
  };

  const handleUpdateStatus = (status: AttendeeStatusEnum) => {
    if (!selectedAttendee) return;
    const isClosed = meetStatus === MeetStatusEnum.Closed;
    const isAlreadyNotified = Boolean(selectedAttendee.respondedAt);
    if (isClosed || isAlreadyNotified) {
      setPendingStatus(status);
      setConfirmDialog(true);
      return;
    }
    applyStatus(status);
  };

  const getUnnotifiedAttendees = () =>
    attendees.filter((attendee) => {
      const status = attendee.status as AttendeeStatusEnum | undefined;
      if (!status || status === AttendeeStatusEnum.Pending) return false;
      return !attendee.respondedAt;
    });

  const handleRequestClose = () => {
    const pending = getUnnotifiedAttendees();
    if (pending.length) {
      setNotifyBeforeCloseAttendees(pending);
      setNotifyBeforeCloseOpen(true);
      return;
    }
    onClose();
  };

  const handleNotifyBeforeCloseLater = () => {
    setNotifyBeforeCloseOpen(false);
    onClose();
  };

  const handleNotifyBeforeCloseNow = async () => {
    if (!meetId || !meet) {
      setNotifyBeforeCloseOpen(false);
      onClose();
      return;
    }
    const pending = notifyBeforeCloseAttendees.filter(
      (attendee) => attendee.email,
    );
    if (!pending.length) {
      setNotifyBeforeCloseOpen(false);
      onClose();
      return;
    }
    setIsNotifyingBeforeClose(true);
    try {
      const byStatus = pending.reduce<
        Partial<Record<AttendeeStatusEnum, string[]>>
      >((acc, attendee) => {
        const rawStatus = attendee.status as AttendeeStatusEnum | undefined;
        if (!rawStatus || rawStatus === AttendeeStatusEnum.Pending) return acc;
        const status =
          rawStatus === AttendeeStatusEnum.CheckedIn ||
          rawStatus === AttendeeStatusEnum.Attended
            ? AttendeeStatusEnum.Confirmed
            : rawStatus === AttendeeStatusEnum.Cancelled ||
                rawStatus === AttendeeStatusEnum.NoShow
              ? AttendeeStatusEnum.Rejected
              : rawStatus;
        if (!acc[status]) acc[status] = [];
        acc[status]?.push(attendee.id);
        return acc;
      }, {});

      for (const [statusKey, attendeeIds] of Object.entries(byStatus)) {
        const ids = attendeeIds || [];
        if (!ids.length) continue;
        const status = statusKey as AttendeeStatusEnum;
        const { subject, content } = getDefaultMessageForStatus(status);
        if (!subject && !content) continue;
        await notifyAttendeeAsync({
          meetId: meet.id,
          subject,
          text: content,
          attendeeIds: ids,
        });
      }
      await refetch();
      enqueueSnackbar("Attendees notified", {
        variant: "success",
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
      });
      setNotifyBeforeCloseOpen(false);
      onClose();
    } catch (err: any) {
      enqueueSnackbar(err?.message || "Failed to notify attendees", {
        variant: "error",
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
      });
    } finally {
      setIsNotifyingBeforeClose(false);
    }
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
  const notifyBeforeCloseCount = notifyBeforeCloseAttendees.length;

  // TODO: Refactor this component into smaller components
  const isOrganizerSelected = Boolean(
    selectedAttendee && meet && selectedAttendee.userId === meet.organizerId,
  );
  const baseInviteLink =
    meet?.shareCode && typeof window !== "undefined"
      ? `${window.location.origin}/meets/${meet.shareCode}`
      : "";
  const inviteLinkForAttendee = (attendeeId: string) =>
    baseInviteLink
      ? `${baseInviteLink}?guestOf=${encodeURIComponent(attendeeId)}`
      : "";
  const openMessageModal = ({
    attendeeIds,
    defaultSubject = "",
    defaultBody = "",
    includeStatusUrl = true,
  }: {
    attendeeIds?: string[];
    defaultSubject?: string;
    defaultBody?: string;
    includeStatusUrl?: boolean;
  }) => {
    setMessageAttendeeIds(attendeeIds);
    setMessageModalDefaults({
      subject: defaultSubject,
      body: defaultBody,
      includeStatusUrl,
    });
    setMessageModalKey((prev) => prev + 1);
    setMessageOpen(true);
  };
  const buildInviteSubject = (meetName?: string | null) =>
    `${meetName || "Meet"} (guest invite)`;
  const buildInviteMessage = (
    name: string,
    link: string,
    hasIndemnity: boolean,
  ) =>
    `Hi ${name},\n\n` +
    "You may invite your guest to fill in the form with the following link:\n\n" +
    `${link}\n\n` +
    (hasIndemnity
      ? "The guest must fill in the form due to indemnity being required. If the guest is a minor you are responsible for you may fill in the form using your own email/phone and accept on their behalf."
      : "The guest invite is optional since no indemnity is required for this meet.");
  const handleInviteMessage = () => {
    if (!selectedAttendee || !baseInviteLink) return;
    const inviteLink = inviteLinkForAttendee(selectedAttendee.id);
    const defaultSubject = buildInviteSubject(meet?.name);
    const defaultBody = buildInviteMessage(
      attendeeLabel(selectedAttendee),
      inviteLink,
      Boolean(meet?.hasIndemnity),
    );
    if (fullScreen) {
      setMessageDrawerRecipientIds([selectedAttendee.id]);
      resetMobileMessageDrawer();
      setMessageDrawerSubject(defaultSubject);
      setMessageDrawerBody(defaultBody);
      setMessageDrawerManualSubject(defaultSubject);
      setMessageDrawerManualBody(defaultBody);
      setMessageDrawerAutoResponse(false);
      setMessageDrawerIncludeStatusUrl(false);
      setMessageDrawerOpen(true);
      return;
    }
    openMessageModal({
      attendeeIds: [selectedAttendee.id],
      defaultSubject,
      defaultBody,
      includeStatusUrl: false,
    });
  };
  const mobileDrawerOpen = fullScreen && Boolean(selectedAttendee);
  const resetMobileMessageDrawer = () => {
    setMessageDrawerSubject("");
    setMessageDrawerBody("");
    setMessageDrawerAutoResponse(false);
    setMessageDrawerManualSubject("");
    setMessageDrawerManualBody("");
    setMessageDrawerError(null);
    setMessageDrawerMarkAsNotified(false);
    setMessageDrawerIncludeStatusUrl(true);
    setMessageDrawerIncludeConfirmed(true);
    setMessageDrawerIncludeWaitlisted(false);
    setMessageDrawerIncludeRejected(false);
  };
  const openMobileMessageDrawerForSelectedAttendee = () => {
    if (!fullScreen || !selectedAttendee) return;
    setMessageDrawerRecipientIds([selectedAttendee.id]);
    resetMobileMessageDrawer();
    setMessageDrawerOpen(true);
  };
  const openMobileMessageDrawerForAllAttendees = () => {
    if (!fullScreen) return;
    setMessageDrawerRecipientIds(undefined);
    resetMobileMessageDrawer();
    setMessageDrawerOpen(true);
  };
  const closeMobileMessageDrawer = () => {
    setMessageDrawerOpen(false);
    setMessageDrawerError(null);
  };
  const handleSendMobileMessage = async () => {
    if (!meet?.id) return;
    if (!messageDrawerSubject.trim() || !messageDrawerBody.trim()) {
      setMessageDrawerError("Subject and message are required");
      return;
    }
    const ids = messageDrawerSelectedAttendees.map((attendee) => attendee.id);
    if (!messageDrawerRecipientIds && ids.length === 0) {
      setMessageDrawerError("Select at least one recipient group");
      return;
    }
    if (
      !messageDrawerRecipientIds &&
      !messageDrawerIncludeConfirmed &&
      !messageDrawerIncludeWaitlisted &&
      !messageDrawerIncludeRejected
    ) {
      setMessageDrawerError("Select at least one recipient group");
      return;
    }
    setMessageDrawerError(null);
    try {
      await notifyAttendeeAsync({
        meetId: meet.id,
        subject: messageDrawerSubject.trim(),
        text: messageDrawerBody,
        attendeeIds: ids.length ? ids : undefined,
        markNotified: messageDrawerAutoResponse || messageDrawerMarkAsNotified,
        includeStatusUrl: messageDrawerIncludeStatusUrl,
      });
      await Promise.all(
        ids.map((attendeeId) =>
          queryClient.invalidateQueries({
            queryKey: ["attendee-messages", meet.id, attendeeId],
          }),
        ),
      );
      enqueueSnackbar("Message sent", {
        variant: "success",
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
      });
      setMessageDrawerOpen(false);
    } catch (err: any) {
      setMessageDrawerError(err?.message || "Failed to send message");
    }
  };

  const attendeeList = (
    <Paper
      variant="outlined"
      sx={{
        width: { xs: "100%", md: 280 },
        flexShrink: 0,
        ...(fullScreen && {
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          height: "100%",
        }),
      }}
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
            <Chip size="small" color="success" label={statusCounts.accepted} />
            <Chip size="small" color="error" label={statusCounts.rejected} />
            <Chip
              size="small"
              color="warning"
              label={statusCounts.waitlisted}
            />
          </Stack>
        </Stack>
      </Box>
      <Divider />
      <List
        sx={{
          maxHeight: fullScreen ? "none" : { xs: 220, md: 420 },
          overflowY: "auto",
          ...(fullScreen && { flex: 1 }),
        }}
      >
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
            return (
              <AttendeeItem
                key={attendee.id}
                attendee={attendee}
                meet={meet}
                selectedAttendeeId={selectedAttendeeId}
                onSelect={setSelectedAttendeeId}
                label={label}
                subLabel={subLabel}
              />
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
  );

  const renderDesktopDetailsPanel = () => {
    if (!selectedAttendee) {
      return (
        <Typography variant="body2" color="text.secondary">
          Select an attendee to view their details.
        </Typography>
      );
    }

    return (
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
          <AttendeesIndemnityInfo
            hasIndemnity={meet?.hasIndemnity}
            indemnityAccepted={selectedAttendee.indemnityAccepted}
            guests={selectedAttendee.guests}
            guestOfLabel={guestOfLabel(selectedAttendee)}
            inviteDisabled={!baseInviteLink}
            guestsUpdating={isGuestsUpdating}
            onGuestIncrement={() => handleGuestCountChange(1)}
            onGuestDecrement={() => handleGuestCountChange(-1)}
            onInvite={handleInviteMessage}
          />
        </Box>
        <Divider />
        {detailView === "messages" ? (
          <AttendeeMessages
            meetId={meetId}
            attendeeId={selectedAttendee?.id}
            attendeeEmail={selectedAttendee?.email}
          />
        ) : (
          <AttendeeResponses responses={selectedAttendee.metaValues} />
        )}
        <Divider />
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          {isOrganizerSelected ? (
            detailView === "messages" ? (
              <Button
                variant="outlined"
                onClick={() =>
                  openMessageModal({
                    attendeeIds: selectedAttendee
                      ? [selectedAttendee.id]
                      : undefined,
                  })
                }
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
              onClick={() =>
                openMessageModal({
                  attendeeIds: selectedAttendee
                    ? [selectedAttendee.id]
                    : undefined,
                })
              }
            >
              Message {attendeeLabel(selectedAttendee)}
            </Button>
          )}
        </Box>
      </Stack>
    );
  };

  const renderMobileDrawerContent = () => {
    if (!selectedAttendee) return null;

    return (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h6">
              {attendeeLabel(selectedAttendee)}
            </Typography>
            <IconButton
              onClick={() => setSelectedAttendeeId(null)}
              aria-label="Close attendee details"
            >
              <CloseIcon />
            </IconButton>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {selectedAttendee.email || selectedAttendee.phone || ""}
          </Typography>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
            sx={{ mt: 1, flexWrap: "wrap" }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
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
            <DetailSelector
              disabled={!selectedAttendee}
              active={detailView === "messages" ? "mail" : "info"}
              showUnread={hasUnreadMessages}
              showEdit={false}
              onInfoClick={() => setDetailView("responses")}
              onMailClick={() => setDetailView("messages")}
              onEditClick={undefined}
            />
          </Stack>
          <Box sx={{ mt: 1.5 }}>
            <AttendeesIndemnityInfo
              hasIndemnity={meet?.hasIndemnity}
              indemnityAccepted={selectedAttendee.indemnityAccepted}
              guests={selectedAttendee.guests}
              guestOfLabel={guestOfLabel(selectedAttendee)}
              inviteDisabled={!baseInviteLink}
              showDivider={false}
              guestsUpdating={isGuestsUpdating}
              onGuestIncrement={() => handleGuestCountChange(1)}
              onGuestDecrement={() => handleGuestCountChange(-1)}
              onInvite={handleInviteMessage}
            />
          </Box>
        </Box>
        <Box
          sx={{
            p: 2,
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
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
                guestOfLabel={guestOfLabel(selectedAttendee)}
              />
            )}
          </Box>
          <Divider sx={{ mt: 2 }} />
          <Box sx={{ display: "flex", justifyContent: "center", pt: 2 }}>
            {isOrganizerSelected ? (
              detailView === "messages" ? (
                <Button
                  variant="outlined"
                  onClick={() => {
                    openMobileMessageDrawerForSelectedAttendee();
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
                  openMobileMessageDrawerForSelectedAttendee();
                }}
              >
                Message {attendeeLabel(selectedAttendee)}
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleRequestClose}
      fullWidth
      maxWidth="md"
      fullScreen={fullScreen}
      sx={{
        "& .MuiDialog-paper": {
          mt: fullScreen ? 0 : 10,
          minHeight: fullScreen ? "100%" : "85vh",
          height: fullScreen ? "100%" : "auto",
          maxHeight: fullScreen ? "100%" : undefined,
          borderRadius: fullScreen ? 0 : undefined,
          m: fullScreen ? 0 : undefined,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pr: 1,
        }}
      >
        <span>Manage attendees</span>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title="Download attendees">
            <IconButton aria-label="Download attendees" size="small">
              <FileDownloadOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Upload attendees">
            <IconButton aria-label="Upload attendees" size="small">
              <FileUploadOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton
            onClick={handleRequestClose}
            aria-label="Close attendees modal"
            data-testid="close-attendees-modal"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent
        sx={{
          pb: fullScreen ? 0 : 2,
          px: fullScreen ? 0 : undefined,
          pt: fullScreen ? 1 : undefined,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {fullScreen ? (
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box sx={{ flex: 1, minHeight: 0 }}>{attendeeList}</Box>
            <Box
              sx={{
                position: "sticky",
                bottom: 0,
                display: "flex",
                gap: 1,
                pt: 1.5,
                pb: 1.5,
                px: 2,
                mt: 0,
                bgcolor: "transparent",
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <Button
                variant="outlined"
                sx={{ flex: 1 }}
                onClick={() => {
                  openMobileMessageDrawerForAllAttendees();
                }}
              >
                Send Message to All Attendees
              </Button>
              <Button
                variant="contained"
                sx={{ flexShrink: 0 }}
                onClick={handleRequestClose}
              >
                Close
              </Button>
            </Box>
            <Drawer
              anchor="right"
              open={mobileDrawerOpen}
              onClose={() => setSelectedAttendeeId(null)}
              sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
              ModalProps={{
                sx: { zIndex: (theme) => theme.zIndex.modal + 1 },
              }}
              PaperProps={{
                sx: {
                  width: "100%",
                  maxWidth: 520,
                  height: "100%",
                },
              }}
            >
              {renderMobileDrawerContent()}
            </Drawer>
            <Drawer
              anchor="bottom"
              open={messageDrawerOpen}
              onClose={closeMobileMessageDrawer}
              sx={{ zIndex: (theme) => theme.zIndex.modal + 200 }}
              ModalProps={{
                sx: { zIndex: (theme) => theme.zIndex.modal + 200 },
              }}
              PaperProps={{
                sx: {
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                },
              }}
            >
              <Box sx={{ width: "100%", maxWidth: 720, mx: "auto", p: 2 }}>
                <Typography variant="h6">Send message</Typography>
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {messageDrawerError && (
                    <span
                      style={{
                        color: "#d32f2f",
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      {messageDrawerError}
                    </span>
                  )}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TextField
                      label="Subject"
                      fullWidth
                      size="small"
                      value={messageDrawerSubject}
                      onChange={(event) => {
                        const value = event.target.value;
                        setMessageDrawerSubject(value);
                        if (!messageDrawerAutoResponse) {
                          setMessageDrawerManualSubject(value);
                        }
                      }}
                      disabled={messageDrawerAutoResponse}
                    />
                    <FormControlLabel
                      label={<Typography variant="body2">Auto</Typography>}
                      control={
                        <Switch
                          checked={messageDrawerAutoResponse}
                          onChange={(event) => {
                            const checked = event.target.checked;
                            setMessageDrawerAutoResponse(checked);
                            setMessageDrawerMarkAsNotified(checked);
                            if (checked) {
                              setMessageDrawerManualSubject(
                                messageDrawerSubject,
                              );
                              setMessageDrawerManualBody(messageDrawerBody);
                              setMessageDrawerSubject(
                                mobileMessageDefault.subject,
                              );
                              setMessageDrawerBody(
                                mobileMessageDefault.content,
                              );
                            } else {
                              setMessageDrawerSubject(
                                messageDrawerManualSubject,
                              );
                              setMessageDrawerBody(messageDrawerManualBody);
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
                    value={messageDrawerBody}
                    onChange={(event) => {
                      const value = event.target.value;
                      setMessageDrawerBody(value);
                      if (!messageDrawerAutoResponse) {
                        setMessageDrawerManualBody(value);
                      }
                    }}
                    disabled={messageDrawerAutoResponse}
                  />
                  {!messageDrawerRecipientIds && (
                    <Stack direction="column" spacing={1}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={messageDrawerIncludeConfirmed}
                            onChange={(event) =>
                              setMessageDrawerIncludeConfirmed(
                                event.target.checked,
                              )
                            }
                          />
                        }
                        label="Send to confirmed attendees"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={messageDrawerIncludeWaitlisted}
                            onChange={(event) =>
                              setMessageDrawerIncludeWaitlisted(
                                event.target.checked,
                              )
                            }
                          />
                        }
                        label="Send to waitlisted attendees"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={messageDrawerIncludeRejected}
                            onChange={(event) =>
                              setMessageDrawerIncludeRejected(
                                event.target.checked,
                              )
                            }
                          />
                        }
                        label="Send to rejected attendees"
                      />
                    </Stack>
                  )}
                  {messageDrawerHasUnnotified && !messageDrawerAutoResponse && (
                    <Stack spacing={1}>
                      <Alert severity="info">
                        Manual messages do not notify attendees of their
                        status. Use the *Auto* switch to send a status
                        notification, or mark them as notified below.
                      </Alert>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={
                              messageDrawerAutoResponse ||
                              messageDrawerMarkAsNotified
                            }
                            onChange={(event) =>
                              setMessageDrawerMarkAsNotified(
                                event.target.checked,
                              )
                            }
                            disabled={messageDrawerAutoResponse}
                          />
                        }
                        label="Mark attendee as notified"
                      />
                    </Stack>
                  )}
                  <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    <Button onClick={closeMobileMessageDrawer}>Cancel</Button>
                    <Button
                      variant="contained"
                      onClick={handleSendMobileMessage}
                      disabled={
                        isMessageSending ||
                        (!messageDrawerRecipientIds &&
                          !messageDrawerIncludeConfirmed &&
                          !messageDrawerIncludeWaitlisted &&
                          !messageDrawerIncludeRejected)
                      }
                    >
                      {isMessageSending ? "Sending..." : "Send"}
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </Drawer>
          </Box>
        ) : (
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{
              minHeight: 360,
              height: "100%",
              flex: 1,
            }}
          >
            {attendeeList}
            <Paper variant="outlined" sx={{ flex: 1, p: 2 }}>
              {renderDesktopDetailsPanel()}
            </Paper>
          </Stack>
        )}
      </DialogContent>
      {!fullScreen && (
        <DialogActions>
          <Box sx={{ flex: 1, display: "flex", justifyContent: "left" }}>
            <Button
              variant="outlined"
              onClick={() => openMessageModal({ attendeeIds: undefined })}
            >
              Send Message to All Attendees
            </Button>
          </Box>
          <Button variant="contained" onClick={handleRequestClose}>
            Close
          </Button>
        </DialogActions>
      )}
      {meet && (
        <MessageModal
          key={messageModalKey}
          open={messageOpen}
          onClose={() => setMessageOpen(false)}
          meet={meet}
          attendeeIds={messageAttendeeIds}
          attendees={attendees}
          defaultSubject={messageModalDefaults.subject}
          defaultBody={messageModalDefaults.body}
          includeStatusUrl={messageModalDefaults.includeStatusUrl}
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
      <ConfirmActionDialog
        open={notifyBeforeCloseOpen}
        title="Notify attendees?"
        description={`${notifyBeforeCloseCount} attendee(s) have a status set but have not been notified. You can notify them now or later using the messaging feature.`}
        confirmLabel={isNotifyingBeforeClose ? "Notifying..." : "Notify now"}
        cancelLabel="Later"
        onConfirm={handleNotifyBeforeCloseNow}
        onClose={handleNotifyBeforeCloseLater}
        isLoading={isNotifyingBeforeClose}
        confirmDisabled={isNotifyingBeforeClose}
      />
      {selectedAttendee && meet && meetId && (
        <OrganizerMetaEditDialog
          open={showEditMetaDialog}
          onClose={() => setShowEditMetaDialog(false)}
          meetId={meetId}
          attendeeId={selectedAttendee.id}
          metaValues={selectedAttendee.metaValues || []}
          hasIndemnity={Boolean(meet.hasIndemnity)}
          indemnityAccepted={Boolean(selectedAttendee.indemnityAccepted)}
        />
      )}
    </Dialog>
  );
}
