import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  List,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useFetchMeetAttendees } from "../hooks/useFetchMeetAttendees";
import { useCheckinAttendees } from "../hooks/useCheckinAttendees";
import { useFetchMeet } from "../hooks/useFetchMeet";
import { useAuth } from "../context/authContext";
import CloseIcon from "@mui/icons-material/Close";
import { ConfirmActionDialog } from "../components/ConfirmActionDialog";
import AttendeeStatusEnum from "../types/AttendeeStatusEnum";
import { AttendeeCheckinItem } from "../components/attendeeCheckin/AttendeeCheckinItem";
import { CheckinSearch } from "../components/attendeeCheckin/CheckinSearch";
import { LockedMeet } from "../components/createMeetModal/LockedMeet";

type MeetCheckinLocationState = {
  returnTo?: string;
};

function MeetCheckinPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation() as ReturnType<typeof useLocation> & {
    state: MeetCheckinLocationState | null;
  };
  const { user } = useAuth();
  const { data: meet } = useFetchMeet(id, Boolean(id));
  const {
    data: attendees,
    isLoading,
    isOfflineData,
    error,
  } = useFetchMeetAttendees(id, "accepted");
  const {
    checkinAttendeesAsync,
    queuedStatusByAttendeeId,
    failedStatusByAttendeeId,
    isOffline,
    pendingCount,
    failedCount,
  } = useCheckinAttendees(id);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const [checkingIn, setCheckingIn] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [undoTarget, setUndoTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isAdminUnlockEnabled, setIsAdminUnlockEnabled] = useState(false);
  const isAdminForMeet = Boolean(
    user?.organizations &&
      meet?.organizationId &&
      user.organizations[meet.organizationId] === "admin",
  );
  const isReadOnly = Boolean(
    meet?.organizerId &&
      user?.id &&
      user.id !== meet.organizerId &&
      !(isAdminForMeet && isAdminUnlockEnabled),
  );

  const attendeeList = useMemo(
    () =>
      attendees.map((attendee) => ({
        id: attendee.id,
        name:
          attendee.name ||
          attendee.email ||
          attendee.phone ||
          "Unnamed attendee",
        email: attendee.email || "",
        phone: attendee.phone || "",
        status: queuedStatusByAttendeeId[attendee.id] || attendee.status || "",
        syncState: failedStatusByAttendeeId[attendee.id]
          ? ("failed" as const)
          : queuedStatusByAttendeeId[attendee.id]
            ? ("queued" as const)
            : undefined,
        syncMessage: failedStatusByAttendeeId[attendee.id] || "",
      })),
    [attendees, failedStatusByAttendeeId, queuedStatusByAttendeeId],
  );

  const filteredAttendees = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return attendeeList;
    return attendeeList.filter((attendee) => {
      const name = attendee.name.toLowerCase();
      const email = attendee.email.toLowerCase();
      const phone = attendee.phone.toLowerCase();
      return (
        name.includes(term) || email.includes(term) || phone.includes(term)
      );
    });
  }, [attendeeList, searchTerm]);

  const handleCheckin = async (attendeeId: string) => {
    if (isReadOnly) return;
    if (!id || checkingIn[attendeeId]) return;
    const attendee = attendeeList.find((item) => item.id === attendeeId);
    if (attendee?.status === AttendeeStatusEnum.CheckedIn) return;
    setCheckingIn((prev) => ({ ...prev, [attendeeId]: true }));
    try {
      await checkinAttendeesAsync({ meetId: id, attendeeIds: [attendeeId] });
    } finally {
      setCheckingIn((prev) => ({ ...prev, [attendeeId]: false }));
    }
  };

  const handleUndoConfirm = async () => {
    if (isReadOnly) return;
    if (!id || !undoTarget) return;
    setCheckingIn((prev) => ({ ...prev, [undoTarget.id]: true }));
    try {
      await checkinAttendeesAsync({
        meetId: id,
        attendeeIds: [undoTarget.id],
        status: "confirmed",
      });
    } finally {
      setCheckingIn((prev) => ({ ...prev, [undoTarget.id]: false }));
      setUndoTarget(null);
    }
  };

  const handleClose = () => {
    const fallbackPath =
      location.state?.returnTo &&
      location.state.returnTo.startsWith("/") &&
      !location.state.returnTo.startsWith("//")
        ? location.state.returnTo
        : "/";

    if (
      typeof window !== "undefined" &&
      import.meta.env.MODE !== "test" &&
      (typeof navigator === "undefined" || !/jsdom/i.test(navigator.userAgent))
    ) {
      window.location.replace(fallbackPath);
      return;
    }

    navigate(fallbackPath, { replace: true });
  };

  return (
    <Container
      maxWidth={isMobile ? false : "sm"}
      disableGutters={isMobile}
      sx={{
        pt: isMobile ? 0 : 2,
        pb: isMobile ? 0 : 2,
        height: isMobile ? "100vh" : "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack spacing={2}>
        <Box
          sx={{
            px: isMobile ? 2 : 0,
            pt: isMobile ? 2 : 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Meet Check-in
            </Typography>
            {!isMobile ? (
              <Typography variant="body2" color="text.secondary">
                Tap names to mark attendees as checked in.
              </Typography>
            ) : null}
          </Box>
          <Stack direction="row" spacing={0.5} alignItems="center">
            {user?.id && meet?.organizerId && user.id !== meet.organizerId ? (
              <LockedMeet
                canUnlock={isAdminForMeet}
                onUnlock={
                  isAdminForMeet
                    ? () => setIsAdminUnlockEnabled(true)
                    : undefined
                }
              />
            ) : null}
            <IconButton aria-label="Close check-in" onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>
        <Box sx={{ px: isMobile ? 2 : 0 }}>
          <CheckinSearch
            value={searchTerm}
            onChange={setSearchTerm}
            onClear={() => setSearchTerm("")}
          />
        </Box>
        {isOffline || pendingCount > 0 || failedCount > 0 || isOfflineData ? (
          <Box sx={{ px: isMobile ? 2 : 0 }}>
            <Alert
              severity={
                failedCount > 0 ? "warning" : isOffline ? "info" : "success"
              }
            >
              {failedCount > 0
                ? `${failedCount} check-in change${failedCount === 1 ? "" : "s"} could not be synced yet.`
                : pendingCount > 0
                  ? `${pendingCount} check-in change${pendingCount === 1 ? "" : "s"} waiting to sync.`
                  : isOfflineData
                    ? "Showing the last saved attendee list while offline."
                    : "Offline mode is active. New check-ins will queue on this device."}
            </Alert>
          </Box>
        ) : null}
        <Paper
          variant="outlined"
          sx={{
            p: 1,
            flex: isMobile ? 1 : "initial",
            borderRadius: isMobile ? 0 : 1,
            overflowY: "auto",
            minHeight: 0,
          }}
        >
          {isLoading ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              Loading attendees...
            </Typography>
          ) : error ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              {error}
            </Typography>
          ) : filteredAttendees.length ? (
            <List>
              {filteredAttendees.map((attendee, index) => (
                <AttendeeCheckinItem
                  key={attendee.id}
                  attendee={attendee}
                  isCheckingIn={Boolean(checkingIn[attendee.id])}
                  isChecked={attendee.status === AttendeeStatusEnum.CheckedIn}
                  syncState={attendee.syncState}
                  syncMessage={attendee.syncMessage}
                  showDivider={index < filteredAttendees.length - 1}
                  disabled={isReadOnly}
                  onCheckin={handleCheckin}
                  onUndo={(target) => setUndoTarget(target)}
                />
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              {isOffline
                ? "No cached attendees available offline."
                : "No attendees yet."}
            </Typography>
          )}
        </Paper>
      </Stack>
      <Box sx={{ mt: 2, px: isMobile ? 2 : 0, pb: isMobile ? 2 : 0 }}>
        <Button fullWidth variant="contained" onClick={handleClose}>
          Finish Check-In
        </Button>
      </Box>
      <ConfirmActionDialog
        open={Boolean(undoTarget)}
        title="Undo check-in?"
        description={undoTarget ? `Undo check-in for ${undoTarget.name}?` : ""}
        confirmLabel="Undo check-in"
        onClose={() => setUndoTarget(null)}
        onConfirm={handleUndoConfirm}
      />
    </Container>
  );
}

export default MeetCheckinPage;
