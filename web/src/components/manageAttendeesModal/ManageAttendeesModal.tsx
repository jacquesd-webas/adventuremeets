import {
  Box,
  Button,
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
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
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
import { AttendeeUploadButton } from "./AttendeeUploadButton";
import { MessageModal } from "./MessageModal";
import { ConfirmClosedStatusDialog } from "./ConfirmClosedStatusDialog";
import Meet from "../../types/MeetModel";
import { AttendeeResponses } from "./AttendeeResponses";
import { AttendeeMessages } from "./AttendeeMessages";
import { OrganizerMetaEditDialog } from "./OrganizerMetaEditDialog";
import { AttendeesIndemnityInfo } from "./AttendeesIndemnityInfo";
import { AttendeeHistory } from "./AttendeeHistory";
import ConfirmActionDialog from "../ConfirmActionDialog";
import MeetStatusEnum from "../../types/MeetStatusEnum";
import AttendeeStatusEnum from "../../types/AttendeeStatusEnum";
import { useFetchAttendeeMessages } from "../../hooks/useFetchAttendeeMessages";
import { useSnackbar } from "notistack";
import { Attendee } from "../../types/AttendeeModel";
import { useApi } from "../../hooks/useApi";
import { LockedTooltipWrapper } from "../LockedTooltipWrapper";
import { LockedMeet } from "../createMeetModal/LockedMeet";
import { AttendeeList } from "./AttendeeList";
import { AttendeePanelHeader } from "./AttendeePanelHeader";
import { ManageAttendeesSectionLoading } from "./ManageAttendeesSectionLoading";

type ManageAttendeesModalProps = {
  open: boolean;
  onClose: () => void;
  meetId?: string | null;
  meet?: Meet | null;
  canViewMeet?: boolean;
  canManageMeet?: boolean;
  isOrganizer?: boolean;
};

export function ManageAttendeesModal({
  open,
  onClose,
  meetId,
  isOrganizer,
  canManageMeet,
}: ManageAttendeesModalProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const {
    data: attendees,
    isLoading: attendeesLoading,
    refetch,
  } = useFetchMeetAttendees(meetId, open ? "all" : null);
  const { data: meet, isLoading: meetLoading } = useFetchMeet(
    meetId,
    Boolean(open && meetId),
  );
  const { updateMeetAttendeeAsync } = useUpdateMeetAttendee();
  const { notifyAttendeeAsync, isLoading: isMessageSending } =
    useNotifyAttendee();
  const { enqueueSnackbar } = useSnackbar();
  const api = useApi();
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
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [detailView, setDetailView] = useState<"responses" | "messages">(
    "responses",
  );
  const { data: attendeeMessages } = useFetchAttendeeMessages(
    meetId,
    selectedAttendeeId,
  );
  const detailsLoading = attendeesLoading || meetLoading;
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
      if (
        messageDrawerIncludeWaitlisted &&
        status === AttendeeStatusEnum.Waitlisted
      )
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
      if (
        !status ||
        status === AttendeeStatusEnum.Pending ||
        status === AttendeeStatusEnum.Invited
      )
        return false;
      return !attendee.respondedAt;
    });

  const handleRequestClose = () => {
    if (!isOrganizer || meetStatus === MeetStatusEnum.Completed) {
      onClose();
      return;
    }
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
        // We only care about Confirmed/Rejected/Waitlisted for messaging purposes
        // any other message can be safely ignored
        if (
          rawStatus !== AttendeeStatusEnum.Confirmed &&
          rawStatus !== AttendeeStatusEnum.Rejected &&
          rawStatus !== AttendeeStatusEnum.Waitlisted
        ) {
          return acc;
        }
        return {
          ...acc,
          [AttendeeStatusEnum.Confirmed]: [
            ...(acc[AttendeeStatusEnum.Confirmed] || []),
            attendee.id,
          ],
        };
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
    if (
      !meet?.id ||
      !messageDrawerSubject.trim() ||
      !messageDrawerBody.trim()
    ) {
      setMessageDrawerError("Subject, message and meet ID are required");
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
      enqueueSnackbar("Message sent", {
        variant: "success",
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
      });
      setMessageDrawerOpen(false);
    } catch (err: any) {
      setMessageDrawerError(err?.message || "Failed to send message");
    }
  };

  const handleDownloadAttendees = async () => {
    if (!meetId || isDownloadingReport) return;
    setIsDownloadingReport(true);
    try {
      const token =
        typeof window !== "undefined"
          ? window.localStorage.getItem("accessToken")
          : null;
      const res = await fetch(`${api.baseUrl}/meets/${meetId}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sendEmail: false,
          downloadReport: true,
          isFinalReport: false,
        }),
      });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Failed to download attendees");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${meet?.name || "meet"}-report.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      enqueueSnackbar(err?.message || "Failed to download attendees", {
        variant: "error",
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
      });
    } finally {
      setIsDownloadingReport(false);
    }
  };

  const renderDesktopDetailsPanel = () => {
    if (!selectedAttendee) {
      if (detailsLoading) {
        return (
          <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
            <ManageAttendeesSectionLoading
              label="Loading attendee details..."
              minHeight={88}
            />
            <Divider />
            <ManageAttendeesSectionLoading
              label="Loading attendee content..."
              minHeight={220}
            />
          </Stack>
        );
      }
      return (
        <Typography variant="body2" color="text.secondary">
          Select an attendee to view their details.
        </Typography>
      );
    }
    return (
      <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
        {detailsLoading ? (
          <ManageAttendeesSectionLoading
            label="Loading attendee header..."
            minHeight={88}
          />
        ) : (
          <AttendeePanelHeader
            selectedAttendee={selectedAttendee}
            setSelectedAttendeeId={setSelectedAttendeeId}
            meet={meet}
            isUpdating={isUpdating}
            isOrganizer={isOrganizer || false}
            canManageMeet={canManageMeet}
            isOrganizerSelected={isOrganizerSelected}
            hasUnreadMessages={hasUnreadMessages}
            detailView={detailView}
            setDetailView={setDetailView}
            handleUpdateStatus={handleUpdateStatus}
            handleAttendeePaid={handleAttendeePaid}
            fullscreen={false}
          />
        )}
        <Divider />
        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pr: 0.5 }}>
          {detailsLoading ? (
            <ManageAttendeesSectionLoading
              label="Loading attendee content..."
              minHeight={220}
            />
          ) : (
            <Stack spacing={2}>
              {detailView === "messages" ? (
                <AttendeeMessages
                  meetId={meetId}
                  attendeeId={selectedAttendee?.id}
                  attendeeEmail={selectedAttendee?.email}
                />
              ) : (
                <Stack spacing={2}>
                  <AttendeesIndemnityInfo
                    hasIndemnity={meet?.hasIndemnity}
                    indemnityAccepted={selectedAttendee.indemnityAccepted}
                    guests={selectedAttendee.guests}
                    guestOfLabel={guestOfLabel(selectedAttendee)}
                    showDivider={false}
                    inviteDisabled={!baseInviteLink}
                    guestsUpdating={isGuestsUpdating}
                    onGuestIncrement={() => handleGuestCountChange(1)}
                    onGuestDecrement={() => handleGuestCountChange(-1)}
                    onInvite={handleInviteMessage}
                    canManageMeet={isOrganizer}
                  />
                  <Divider />
                  <AttendeeResponses responses={selectedAttendee.metaValues} />
                  <Divider />
                  <AttendeeHistory
                    attendeeId={selectedAttendee?.id}
                    meetId={meetId}
                  />
                </Stack>
              )}
            </Stack>
          )}
        </Box>
        <Divider />
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <LockedTooltipWrapper isReadOnly={!isOrganizer}>
            {isOrganizerSelected ? (
              detailView === "messages" ? (
                <Button
                  variant="outlined"
                  disabled={!isOrganizer}
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
                  disabled={!isOrganizer}
                >
                  Edit responses
                </Button>
              )
            ) : (
              <Button
                variant="outlined"
                disabled={!selectedAttendee || !isOrganizer}
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
          </LockedTooltipWrapper>
        </Box>
      </Stack>
    );
  };

  const renderMobileDrawerContent = () => {
    if (!selectedAttendee) {
      return detailsLoading ? (
        <Box sx={{ p: 2 }}>
          <ManageAttendeesSectionLoading
            label="Loading attendee details..."
            minHeight={220}
          />
        </Box>
      ) : null;
    }

    return (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {detailsLoading ? (
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <ManageAttendeesSectionLoading
              label="Loading attendee header..."
              minHeight={88}
            />
          </Box>
        ) : (
          <AttendeePanelHeader
            selectedAttendee={selectedAttendee}
            setSelectedAttendeeId={setSelectedAttendeeId}
            meet={meet}
            isUpdating={isUpdating}
            isOrganizer={isOrganizer || false}
            canManageMeet={canManageMeet}
            isOrganizerSelected={isOrganizerSelected}
            hasUnreadMessages={hasUnreadMessages}
            detailView={detailView}
            setDetailView={setDetailView}
            handleUpdateStatus={handleUpdateStatus}
            handleAttendeePaid={handleAttendeePaid}
            fullscreen={true}
          />
        )}

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
            {detailsLoading ? (
              <ManageAttendeesSectionLoading
                label="Loading attendee content..."
                minHeight={220}
              />
            ) : (
              detailView === "messages" ? (
                <AttendeeMessages
                  meetId={meetId}
                  attendeeId={selectedAttendee?.id}
                  attendeeEmail={selectedAttendee?.email}
                />
              ) : (
                <>
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
                    canManageMeet={isOrganizer}
                  />
                  <Divider sx={{ mt: 1, mb: 2 }} />
                  <AttendeeResponses
                    indemnityAccepted={selectedAttendee.indemnityAccepted}
                    indemnityMinors={selectedAttendee.indemnityMinors}
                    responses={selectedAttendee.metaValues}
                    guestOfLabel={guestOfLabel(selectedAttendee)}
                  />
                  <Divider sx={{ mt: 1, mb: 2 }} />
                  <AttendeeHistory
                    attendeeId={selectedAttendee?.id}
                    meetId={meetId}
                  />
                </>
              )
            )}
          </Box>
          <Divider sx={{ mt: 2 }} />
          <Box sx={{ display: "flex", justifyContent: "center", pt: 2 }}>
            {isOrganizerSelected ? (
              detailView === "messages" ? (
                <LockedTooltipWrapper isReadOnly={!isOrganizer}>
                  <Button
                    variant="outlined"
                    disabled={!isOrganizer}
                    onClick={() => {
                      openMobileMessageDrawerForSelectedAttendee();
                    }}
                  >
                    Message {attendeeLabel(selectedAttendee)}
                  </Button>
                </LockedTooltipWrapper>
              ) : (
                <Button
                  variant="outlined"
                  onClick={() => setShowEditMetaDialog(true)}
                >
                  Edit responses
                </Button>
              )
            ) : (
              <LockedTooltipWrapper isReadOnly={!isOrganizer}>
                <Button
                  variant="outlined"
                  disabled={!selectedAttendee || !isOrganizer}
                  onClick={() => {
                    openMobileMessageDrawerForSelectedAttendee();
                  }}
                >
                  Message {attendeeLabel(selectedAttendee)}
                </Button>
              </LockedTooltipWrapper>
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
          {!isOrganizer ? <LockedMeet canUnlock={canManageMeet} /> : null}
          <Tooltip title="Download attendees">
            <IconButton
              aria-label="Download attendees"
              size="small"
              onClick={handleDownloadAttendees}
              disabled={!meetId || isDownloadingReport}
            >
              <FileDownloadOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <AttendeeUploadButton meetId={meetId} disabled={!meetId} />
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
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <AttendeeList
                attendees={attendees}
                isLoading={attendeesLoading}
                meet={meet}
                selectedAttendeeId={selectedAttendeeId}
                setSelectedAttendeeId={setSelectedAttendeeId}
                fullScreen={fullScreen}
              />
            </Box>
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
              <LockedTooltipWrapper isReadOnly={!isOrganizer}>
                <Button
                  variant="outlined"
                  sx={{ flex: 1 }}
                  disabled={!isOrganizer}
                  onClick={() => {
                    openMobileMessageDrawerForAllAttendees();
                  }}
                >
                  Send Message to All Attendees
                </Button>
              </LockedTooltipWrapper>
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
                        Manual messages do not notify attendees of their status.
                        Use the *Auto* switch to send a status notification, or
                        mark them as notified below.
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
            <AttendeeList
              attendees={attendees}
              isLoading={attendeesLoading}
              meet={meet}
              selectedAttendeeId={selectedAttendeeId}
              setSelectedAttendeeId={setSelectedAttendeeId}
              fullScreen={fullScreen}
            />
            <Paper
              variant="outlined"
              sx={{ flex: 1, p: 2, display: "flex", minHeight: 0 }}
            >
              {renderDesktopDetailsPanel()}
            </Paper>
          </Stack>
        )}
      </DialogContent>
      {!fullScreen && (
        <DialogActions>
          <Box sx={{ flex: 1, display: "flex", justifyContent: "left" }}>
            <LockedTooltipWrapper isReadOnly={!isOrganizer}>
              <Button
                variant="outlined"
                disabled={!isOrganizer}
                onClick={() => openMessageModal({ attendeeIds: undefined })}
              >
                Send Message to All Attendees
              </Button>
            </LockedTooltipWrapper>
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
