import {
  Box,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import HistoryIcon from "@mui/icons-material/History";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import PlaceIcon from "@mui/icons-material/Place";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import Meet from "../../types/MeetModel";
import { MeetActionsMenu } from "../MeetActionsMenu";
import { MeetActionsEnum } from "../../types/MeetActionsEnum";
import MeetStatusEnum from "../../types/MeetStatusEnum";
import { MeetStatus } from "../MeetStatus";
import AttendeeStatusEnum from "../../types/AttendeeStatusEnum";
import { useAuth } from "../../context/authContext";
import { getCardRangeLabel } from "../../helpers/meetTime";

type MeetCardProps = {
  meet: Meet;
  statusLabel: string;
  onClick?: () => void;
  setSelectedMeetId: (id: string | null) => void;
  setPendingAction: (action: MeetActionsEnum | null) => void;
  isOrganizer: boolean;
};

type CountProps = { count1?: number; count2?: number };

const DraftCardCount = () => <></>;

const AttendeeStatus = ({
  status,
  isUpcoming,
}: {
  status?: AttendeeStatusEnum;
  isUpcoming: boolean;
}) => {
  const color =
    status === AttendeeStatusEnum.Confirmed ||
    status === AttendeeStatusEnum.CheckedIn ||
    status === AttendeeStatusEnum.Attended
      ? "success"
      : status === AttendeeStatusEnum.Waitlisted
        ? "warning"
        : status === AttendeeStatusEnum.Rejected
          ? "error"
          : "disabled";

  const text = isUpcoming
    ? status === AttendeeStatusEnum.Confirmed ||
      status === AttendeeStatusEnum.CheckedIn ||
      status === AttendeeStatusEnum.Attended
      ? "Attending"
      : status === AttendeeStatusEnum.Waitlisted
        ? "Waitlisted"
        : status === AttendeeStatusEnum.Rejected ||
            status === AttendeeStatusEnum.Cancelled
          ? "Not accepted"
          : status === AttendeeStatusEnum.Pending
            ? "Pending"
            : "Did not apply"
    : status === AttendeeStatusEnum.Confirmed ||
        status === AttendeeStatusEnum.CheckedIn ||
        status === AttendeeStatusEnum.Attended
      ? "Attended"
      : "Did not attend";

  return (
    <Stack direction="row" spacing={2} alignItems="center" mt={1.5}>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <GroupOutlinedIcon fontSize="small" color={color} />
        <Typography variant="caption" color="text.secondary">
          {text}
        </Typography>
      </Stack>
    </Stack>
  );
};

const UpcomingCardCount = ({ count1, count2 }: CountProps) => {
  return (
    <Stack direction="row" spacing={2} alignItems="center" mt={1.5}>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <GroupOutlinedIcon fontSize="small" color="primary" />
        <Typography variant="body2" fontWeight={600} color="text.secondary">
          {count1 ?? 0}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          applicants
        </Typography>
      </Stack>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <GroupOutlinedIcon fontSize="small" color="disabled" />
        <Typography variant="body2" fontWeight={600} color="text.secondary">
          {count2 ?? 0}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          waitlist
        </Typography>
      </Stack>
    </Stack>
  );
};

const PastCardCount = ({ count1, count2 }: CountProps) => {
  return (
    <Stack direction="row" spacing={2} alignItems="center" mt={1.5}>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <CheckCircleOutlineIcon fontSize="small" color="primary" />
        <Typography variant="body2" fontWeight={600} color="text.secondary">
          {count1 ?? 0}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          confirmed
        </Typography>
      </Stack>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <GroupOutlinedIcon fontSize="small" color="disabled" />
        <Typography variant="body2" fontWeight={600} color="text.secondary">
          {count2 ?? 0}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          attended
        </Typography>
      </Stack>
    </Stack>
  );
};

export function MeetCard({
  meet,
  statusLabel,
  onClick,
  setSelectedMeetId,
  setPendingAction,
}: MeetCardProps) {
  const theme = useTheme();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const isUpcoming = new Date(meet.endTime) >= new Date();
  const isDraft = meet.statusId === MeetStatusEnum.Draft;
  const rangeLabel = getCardRangeLabel(meet);
  const isOrganizerForMeet = user && meet && user.id === meet.organizerId;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        cursor: isMobile ? "default" : "pointer",
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      onClick={() => {
        if (!isMobile && typeof onClick === "function") {
          onClick();
        }
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        {isUpcoming ? (
          <EventAvailableIcon color="primary" />
        ) : isDraft ? (
          <EditNoteOutlinedIcon color="action" />
        ) : (
          <HistoryIcon color="action" />
        )}
        <Typography variant="h6" sx={{ flex: 1 }}>
          {meet.name}
        </Typography>
        <MeetStatus statusId={meet.statusId} fallbackLabel={statusLabel} />
        <Box sx={{ ml: 0.5 }} onClick={(e) => e.stopPropagation()}>
          <MeetActionsMenu
            meetId={meet.id}
            isOrganizer={isOrganizerForMeet}
            statusId={meet.statusId}
            setSelectedMeetId={setSelectedMeetId}
            setPendingAction={setPendingAction}
            previewLinkCode={meet.shareCode}
          />
        </Box>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center" mt={1}>
        <PlaceIcon fontSize="small" color="disabled" />
        <Typography variant="body2" color="text.secondary">
          {meet.location}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center" mt={1}>
        <AccessTimeIcon fontSize="small" color="disabled" />
        {rangeLabel ? (
          <Typography variant="body2" color="text.secondary">
            {rangeLabel}
          </Typography>
        ) : null}
      </Stack>
      {!isOrganizerForMeet ? (
        <AttendeeStatus
          status={meet.myAttendeeStatus as AttendeeStatusEnum | undefined}
          isUpcoming={isUpcoming}
        />
      ) : isDraft ? (
        <DraftCardCount />
      ) : isUpcoming ? (
        <UpcomingCardCount
          count1={meet.attendeeCount}
          count2={meet.waitlistCount}
        />
      ) : (
        <PastCardCount
          count1={meet.confirmedCount}
          count2={meet.checkedInCount}
        />
      )}
    </Paper>
  );
}
