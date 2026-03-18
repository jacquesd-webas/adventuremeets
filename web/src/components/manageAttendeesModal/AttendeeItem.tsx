import {
  Avatar,
  Box,
  Chip,
  ListItemButton,
  ListItemText,
  Stack,
  useTheme,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CancelIcon from "@mui/icons-material/Cancel";
import QuestionMarkOutlinedIcon from "@mui/icons-material/QuestionMarkOutlined";
import SupervisorAccountOutlinedIcon from "@mui/icons-material/SupervisorAccountOutlined";
import AttendeeStatusEnum from "../../types/AttendeeStatusEnum";
import Meet from "../../types/MeetModel";

export type AttendeeItemProps = {
  attendee: any;
  meet?: Meet | null;
  selectedAttendeeId?: string | null;
  onSelect: (id: string) => void;
  label: string;
  subLabel?: string;
};

export function AttendeeItem({
  attendee,
  meet,
  selectedAttendeeId,
  onSelect,
  label,
  subLabel = "",
}: AttendeeItemProps) {
  const theme = useTheme();
  const paidLabel = attendee.paidFullAt
    ? "Paid"
    : attendee.paidDepositAt
      ? "Dep"
      : null;
  const paidColor = attendee.paidFullAt ? "info.main" : "secondary.main";
  const isConfirmed =
    attendee.status === AttendeeStatusEnum.Confirmed ||
    attendee.status === AttendeeStatusEnum.Attended ||
    attendee.status === AttendeeStatusEnum.CheckedIn;
  const isRejected =
    attendee.status === AttendeeStatusEnum.Rejected ||
    attendee.status === AttendeeStatusEnum.Cancelled;
  const isPending = attendee.status === AttendeeStatusEnum.Pending;
  const isWaitlisted = attendee.status === AttendeeStatusEnum.Waitlisted;
  const isOrganizer = attendee && meet && attendee.userId === meet.organizerId;
  const showGuestChip = Boolean(attendee?.guestOf);
  const isNotified = Boolean(attendee?.respondedAt);

  return (
    <ListItemButton
      selected={attendee.id === selectedAttendeeId}
      onClick={() => onSelect(attendee.id)}
    >
      {!isPending ? (
        <Box
          sx={{
            width: 32,
            height: 32,
            mr: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {isOrganizer ? (
            <SupervisorAccountOutlinedIcon
              fontSize="large"
              style={{ color: theme.palette.primary.main }}
            />
          ) : isConfirmed ? (
            isNotified ? (
              <CheckCircleIcon
                fontSize="large"
                style={{ color: theme.palette.success.main }}
              />
            ) : (
              <CheckCircleOutlineIcon
                fontSize="large"
                style={{ color: theme.palette.success.main }}
              />
            )
          ) : isWaitlisted ? (
            isNotified ? (
              <CheckCircleIcon
                fontSize="large"
                style={{ color: theme.palette.warning.main }}
              />
            ) : (
              <CheckCircleOutlineIcon
                fontSize="large"
                style={{ color: theme.palette.warning.main }}
              />
            )
          ) : isRejected ? (
            isNotified ? (
              <CancelIcon
                fontSize="large"
                style={{ color: theme.palette.error.main }}
              />
            ) : (
              <CancelOutlinedIcon
                fontSize="large"
                style={{ color: theme.palette.error.main }}
              />
            )
          ) : (
            <QuestionMarkOutlinedIcon
              fontSize="large"
              style={{ color: theme.palette.action.disabled }}
            />
          )}
          {paidLabel ? (
            <Box
              component="span"
              sx={{
                position: "absolute",
                top: -4,
                right: -6,
                px: 0.5,
                borderRadius: 999,
                border: "1px solid",
                borderColor: paidColor,
                color: paidColor,
                bgcolor: "background.paper",
                fontSize: 9,
                lineHeight: 1.2,
                fontWeight: 700,
                letterSpacing: 0.2,
              }}
            >
              {paidLabel}
            </Box>
          ) : null}
        </Box>
      ) : (
        <Avatar sx={{ width: 32, height: 32, mr: 1.5 }}>?</Avatar>
      )}
      <ListItemText
        primary={
          <Stack direction="row" spacing={1} alignItems="center">
            <Box component="span">{label}</Box>
            {showGuestChip ? (
              <Chip
                label="Guest"
                color="info"
                variant="outlined"
                size="small"
                sx={{
                  height: 16,
                  fontSize: 9,
                  px: 0.5,
                  "& .MuiChip-label": { px: 0.5, lineHeight: 1 },
                }}
              />
            ) : null}
          </Stack>
        }
        secondary={subLabel}
        primaryTypographyProps={{ fontWeight: 600 }}
      />
    </ListItemButton>
  );
}
