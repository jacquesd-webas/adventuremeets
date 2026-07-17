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
import Meet from "../../types/MeetModel";
import { MeetActionsMenu } from "../meet/MeetActionsMenu";
import { MeetActionsEnum } from "../../types/MeetActionsEnum";
import MeetStatusEnum from "../../types/MeetStatusEnum";
import { MeetStatus } from "../meet/MeetStatus";
import AttendeeStatusEnum from "../../types/AttendeeStatusEnum";
import { useRef } from "react";
import type { OverridableStringUnion } from "@mui/types";
import type { SvgIconPropsColorOverrides } from "@mui/material/SvgIcon";
import { getCardRangeLabel, isMeetUpcoming } from "../../helpers/meetTime";
import { useAuth } from "../../context/authContext";

type MeetCardProps = {
  meet: Meet;
  statusLabel: string;
  onClick?: () => void;
  setSelectedMeetId: (id: string | null) => void;
  setPendingAction: (action: MeetActionsEnum | null) => void;
  canViewMeet: boolean;
  canManageMeet: boolean;
  canAccessManageMenu?: boolean;
};

type StatItemProps = {
  count?: number | string;
  label: string;
  color: OverridableStringUnion<
    | "inherit"
    | "action"
    | "disabled"
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning",
    SvgIconPropsColorOverrides
  >;
};

const DraftCardCount = () => <></>;

const StatItem = ({ count, label, color }: StatItemProps) => (
  <Stack direction="row" spacing={0.5} alignItems="center">
    <GroupOutlinedIcon fontSize="small" color={color} />
    <Typography variant="body2" fontWeight={600} color="text.secondary">
      {count ?? 0}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
  </Stack>
);

function hasApplicants(attendeeCount?: number) {
  return (attendeeCount ?? 0) > 0;
}

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

const UpcomingCardCount = ({
  attendeeCount,
  confirmedCount,
  waitlistCount,
  rejectedCount,
}: {
  attendeeCount?: number;
  confirmedCount?: number;
  waitlistCount?: number;
  rejectedCount?: number;
}) => {
  const showAdditionalStats = hasApplicants(attendeeCount);

  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="center"
      mt={1.5}
      useFlexGap
      flexWrap="wrap"
    >
      <StatItem count={attendeeCount} label="applicants" color="primary" />
      {showAdditionalStats ? (
        <>
          <StatItem count={confirmedCount} label="approved" color="success" />
          <StatItem count={waitlistCount} label="waitlist" color="disabled" />
          <StatItem count={rejectedCount} label="rejected" color="error" />
        </>
      ) : null}
    </Stack>
  );
};

const PastCardCount = ({
  attendeeCount,
  confirmedCount,
  waitlistCount,
  rejectedCount,
  checkedInCount,
}: {
  attendeeCount?: number;
  confirmedCount?: number;
  waitlistCount?: number;
  rejectedCount?: number;
  checkedInCount?: number;
}) => {
  const attendedRatio =
    (confirmedCount ?? 0 > 0)
      ? `${checkedInCount ?? 0}/${confirmedCount ?? 0}`
      : "0";
  const showAdditionalStats = hasApplicants(attendeeCount);

  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="center"
      mt={1.5}
      useFlexGap
      flexWrap="wrap"
    >
      <StatItem count={attendeeCount} label="applicants" color="primary" />
      {showAdditionalStats ? (
        <>
          <StatItem count={attendedRatio} label="attended" color="disabled" />
          <StatItem count={waitlistCount} label="waitlist" color="disabled" />
          <StatItem count={rejectedCount} label="rejected" color="error" />
        </>
      ) : null}
    </Stack>
  );
};

export function MeetCard({
  meet,
  statusLabel,
  onClick,
  setSelectedMeetId,
  setPendingAction,
  canViewMeet,
  canManageMeet,
  canAccessManageMenu,
}: MeetCardProps) {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  const isUpcoming = isMeetUpcoming(meet);
  const isDraft = meet.statusId === MeetStatusEnum.Draft;
  const rangeLabel = getCardRangeLabel(meet);
  const isOrganizerForMeet = user?.id === meet.organizerId;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        cursor: typeof onClick === "function" ? "pointer" : "default",
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      onClick={() => {
        if (typeof onClick === "function") {
          if (isMobile) {
            menuButtonRef.current?.click();
          } else {
            onClick();
          }
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
            canAccessManageMenu={canAccessManageMenu}
            canViewMeet={canViewMeet}
            canManageMeet={canManageMeet}
            statusId={meet.statusId}
            isUpcoming={isUpcoming}
            startTime={
              meet.startTime instanceof Date
                ? meet.startTime.toISOString()
                : meet.startTime
            }
            setSelectedMeetId={setSelectedMeetId}
            setPendingAction={setPendingAction}
            previewLinkCode={meet.shareCode}
            menuButtonRef={menuButtonRef}
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
          attendeeCount={meet.attendeeCount}
          confirmedCount={meet.confirmedCount}
          waitlistCount={meet.waitlistCount}
          rejectedCount={meet.rejectedCount}
        />
      ) : (
        <PastCardCount
          attendeeCount={meet.attendeeCount}
          confirmedCount={meet.confirmedCount}
          waitlistCount={meet.waitlistCount}
          rejectedCount={meet.rejectedCount}
          checkedInCount={meet.checkedInCount}
        />
      )}
    </Paper>
  );
}
