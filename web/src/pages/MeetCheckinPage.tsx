import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
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
import CloseIcon from "@mui/icons-material/Close";
import { ConfirmActionDialog } from "../components/ConfirmActionDialog";
import AttendeeStatusEnum from "../types/AttendeeStatusEnum";
import { AttendeeCheckinItem } from "../components/attendeeCheckin/AttendeeCheckinItem";
import { CheckinSearch } from "../components/attendeeCheckin/CheckinSearch";

function MeetCheckinPage() {
  const { id } = useParams<{ id: string }>();
  const { data: attendees, isLoading } = useFetchMeetAttendees(id, "accepted");
  const { checkinAttendeesAsync } = useCheckinAttendees();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [checkingIn, setCheckingIn] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [undoTarget, setUndoTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

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
        status: attendee.status || "",
      })),
    [attendees],
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

  useEffect(() => {
    const initial = attendeeList.reduce<Record<string, boolean>>(
      (acc, attendee) => {
        if (attendee.status === AttendeeStatusEnum.CheckedIn) {
          acc[attendee.id] = true;
        }
        return acc;
      },
      {},
    );
    setChecked(initial);
  }, [attendeeList]);

  const handleCheckin = async (attendeeId: string) => {
    if (!id || checkingIn[attendeeId]) return;
    if (checked[attendeeId]) return;
    setCheckingIn((prev) => ({ ...prev, [attendeeId]: true }));
    try {
      await checkinAttendeesAsync({ meetId: id, attendeeIds: [attendeeId] });
      setChecked((prev) => ({ ...prev, [attendeeId]: true }));
    } finally {
      setCheckingIn((prev) => ({ ...prev, [attendeeId]: false }));
    }
  };

  const handleUndoConfirm = async () => {
    if (!id || !undoTarget) return;
    setCheckingIn((prev) => ({ ...prev, [undoTarget.id]: true }));
    try {
      await checkinAttendeesAsync({
        meetId: id,
        attendeeIds: [undoTarget.id],
        status: "confirmed",
      });
      setChecked((prev) => ({ ...prev, [undoTarget.id]: false }));
    } finally {
      setCheckingIn((prev) => ({ ...prev, [undoTarget.id]: false }));
      setUndoTarget(null);
    }
  };

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/dashboard");
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
      <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
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
          <IconButton aria-label="Close check-in" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ px: isMobile ? 2 : 0 }}>
          <CheckinSearch
            value={searchTerm}
            onChange={setSearchTerm}
            onClear={() => setSearchTerm("")}
          />
        </Box>
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
          ) : filteredAttendees.length ? (
            <List>
              {filteredAttendees.map((attendee, index) => (
                <AttendeeCheckinItem
                  key={attendee.id}
                  attendee={attendee}
                  isCheckingIn={Boolean(checkingIn[attendee.id])}
                  isChecked={Boolean(checked[attendee.id])}
                  showDivider={index < filteredAttendees.length - 1}
                  onCheckin={handleCheckin}
                  onUndo={(target) => setUndoTarget(target)}
                />
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              No attendees yet.
            </Typography>
          )}
        </Paper>
      </Stack>
      <Box sx={{ position: "sticky", bottom: 0, mt: 2 }} />
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
