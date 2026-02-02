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
import formatRange from "../../helpers/formatRange";
import Meet from "../../models/MeetModel";
import { MeetActionsMenu } from "../MeetActionsMenu";
import { PendingAction } from "../MeetActionsDialogs";
import MeetStatusEnum from "../../models/MeetStatusEnum";
import { MeetStatus } from "../MeetStatus";

type MeetCardProps = {
  meet: Meet;
  statusLabel: string;
  onClick?: () => void;
  setSelectedMeetId: (id: string | null) => void;
  setPendingAction: (action: PendingAction | null) => void;
};

type CountProps = { count1?: number; count2?: number };

const DraftCardCount = () => <></>;

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
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isUpcoming = new Date(meet.endTime) >= new Date();
  const isDraft = meet.statusId === MeetStatusEnum.Draft;
  const rangeLabel = formatRange(meet.startTime, meet.endTime);
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, cursor: isMobile ? "default" : "pointer" }}
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
      {isDraft ? (
        <DraftCardCount />
      ) : isUpcoming ? (
        <UpcomingCardCount
          count1={meet.attendeeCount}
          count2={meet.waitlistCount}
        />
      ) : (
        <PastCardCount
          count1={meet.confirmedCount}
          count2={meet.attendeeCount}
        />
      )}
    </Paper>
  );
}
