import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AttendeeStatusEnum from "../../types/AttendeeStatusEnum";

type MatchAttendee = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
};

type MeetSelfCheckinMatchDialogProps = {
  open: boolean;
  attendees: MatchAttendee[];
  onSelect: (attendee: MatchAttendee) => void;
  onClose: () => void;
};

function formatStatus(status?: string) {
  if (!status) return "Unknown status";
  if (status === AttendeeStatusEnum.CheckedIn) return "Checked in";
  if (status === AttendeeStatusEnum.Attended) return "Attended";
  if (status === AttendeeStatusEnum.Confirmed) return "Confirmed";
  if (status === AttendeeStatusEnum.Waitlisted) return "Waitlisted";
  if (status === AttendeeStatusEnum.Rejected) return "Rejected";
  if (status === AttendeeStatusEnum.Pending) return "Pending";
  return status;
}

export function MeetSelfCheckinMatchDialog({
  open,
  attendees,
  onSelect,
  onClose,
}: MeetSelfCheckinMatchDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Which attendee should we check in?</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            We found more than one possible attendee record for these details.
          </Typography>
          <List disablePadding>
            {attendees.map((attendee) => {
              const secondaryParts = [
                attendee.email,
                attendee.phone,
                formatStatus(attendee.status),
              ].filter(Boolean);

              return (
                <ListItemButton
                  key={attendee.id}
                  onClick={() => onSelect(attendee)}
                  divider
                >
                  <ListItemText
                    primary={attendee.name || "Unnamed attendee"}
                    secondary={secondaryParts.join(" • ")}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}

export type { MatchAttendee };
