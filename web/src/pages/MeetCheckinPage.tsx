import { useMemo, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useFetchMeetAttendees } from "../hooks/useFetchMeetAttendees";
import { useCheckinAttendees } from "../hooks/useCheckinAttendees";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import UndoOutlinedIcon from "@mui/icons-material/UndoOutlined";
import { ConfirmActionDialog } from "../components/ConfirmActionDialog";

function MeetCheckinPage() {
  const { id } = useParams<{ id: string }>();
  const { data: attendees, isLoading } = useFetchMeetAttendees(id, "accepted");
  const { checkinAttendeesAsync } = useCheckinAttendees();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [checkingIn, setCheckingIn] = useState<Record<string, boolean>>({});
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
    [attendees]
  );

  useEffect(() => {
    const initial = attendeeList.reduce<Record<string, boolean>>(
      (acc, attendee) => {
        if (attendee.status === "checked-in") {
          acc[attendee.id] = true;
        }
        return acc;
      },
      {}
    );
    setChecked(initial);
  }, [attendeeList]);

  const handleTapCheckin = async (attendeeId: string) => {
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

  return (
    <Container
      maxWidth={isMobile ? false : "sm"}
      disableGutters={isMobile}
      sx={{
        pt: isMobile ? 0 : 2,
        pb: isMobile ? 0 : 2,
        height: isMobile ? "100vh" : "auto",
      }}
    >
      <Stack spacing={2}>
        <Box sx={{ px: isMobile ? 2 : 0, pt: isMobile ? 2 : 0 }}>
          <Typography variant="h5" fontWeight={700}>
            Meet Check-in
          </Typography>
          {!isMobile ? (
            <Typography variant="body2" color="text.secondary">
              Tap names to mark attendees as checked in.
            </Typography>
          ) : null}
        </Box>
        <Paper
          variant="outlined"
          sx={{
            p: 1,
            flex: isMobile ? 1 : "initial",
            borderRadius: isMobile ? 0 : 1,
          }}
        >
          {isLoading ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              Loading attendees...
            </Typography>
          ) : attendeeList.length ? (
            <List>
              {attendeeList.map((attendee, index) => (
                <Box key={attendee.id}>
                  <ListItem
                    disableGutters
                    secondaryAction={null}
                    onClick={() => handleTapCheckin(attendee.id)}
                    sx={{ borderRadius: 1, px: 1 }}
                  >
                    <ListItemIcon>
                      {checkingIn[attendee.id] ? (
                        <CircularProgress size={28} />
                      ) : checked[attendee.id] ? (
                        <CheckBoxIcon color="success" sx={{ fontSize: 32 }} />
                      ) : (
                        <HelpOutlineIcon
                          color="disabled"
                          sx={{ fontSize: 32 }}
                        />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={attendee.name}
                      primaryTypographyProps={{
                        variant: "subtitle1",
                        fontWeight: 600,
                      }}
                      secondaryTypographyProps={{ component: "div" }}
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ flexWrap: "wrap" }}
                          >
                            {attendee.email ? (
                              <Chip
                                size="small"
                                label={attendee.email}
                                color="default"
                              />
                            ) : null}
                            {attendee.phone ? (
                              <Chip
                                size="small"
                                label={attendee.phone}
                                color="default"
                              />
                            ) : null}
                          </Stack>
                        </Box>
                      }
                    />
                    {checked[attendee.id] ? (
                      <IconButton
                        edge="end"
                        onClick={() => setUndoTarget(attendee)}
                      >
                        <UndoOutlinedIcon fontSize="small" />
                      </IconButton>
                    ) : null}
                  </ListItem>
                  {index < attendeeList.length - 1 ? <Divider /> : null}
                </Box>
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
