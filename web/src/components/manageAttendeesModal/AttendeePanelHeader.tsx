import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Meet } from "../../types/MeetModel";
import { Attendee } from "../../types/AttendeeModel";
import AttendeeStatusEnum from "../../types/AttendeeStatusEnum";
import { AttendeeActionButtons } from "./AttendeeActionButtons";
import { DetailSelector } from "./DetailSelector";

type AttendeePanelHeaderProps = {
  selectedAttendee: Attendee;
  setSelectedAttendeeId?: (attendeeId: string | null) => void;
  meet: Meet | null;
  isUpdating: boolean;
  isOrganizer: boolean;
  canManageMeet?: boolean;
  isOrganizerSelected: boolean;
  hasUnreadMessages: boolean;
  detailView: "responses" | "messages";
  setDetailView: (view: "responses" | "messages") => void;
  handleUpdateStatus: (status: AttendeeStatusEnum) => void;
  handleAttendeePaid: () => void;
  fullscreen: boolean;
};

export function AttendeePanelHeader({
  selectedAttendee,
  setSelectedAttendeeId,
  meet,
  isUpdating,
  canManageMeet,
  isOrganizerSelected,
  hasUnreadMessages,
  detailView,
  setDetailView,
  handleUpdateStatus,
  handleAttendeePaid,
  fullscreen,
}: AttendeePanelHeaderProps) {
  const attendeeLabel = (attendee: Attendee) =>
    attendee?.name || attendee?.email || attendee?.phone || "Unnamed attendee";

  // Mobile version is a bit different from the desktop version
  if (fullscreen)
    return (
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
            onClick={() =>
              typeof setSelectedAttendeeId === "function" &&
              setSelectedAttendeeId(null)
            }
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
                canManageMeet={canManageMeet}
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
      </Box>
    );

  // Desktop version
  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
      >
        <Typography variant="h6">{attendeeLabel(selectedAttendee)}</Typography>
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
              canManageMeet={canManageMeet}
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
    </Box>
  );
}
