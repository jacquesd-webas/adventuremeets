import {
  Box,
  Chip,
  Divider,
  List,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Meet } from "../../types/MeetModel";
import { Attendee } from "../../types/AttendeeModel";
import { AttendeeItem } from "./AttendeeItem";
import { AttendeeStatusEnum } from "../../types/AttendeeStatusEnum";
import { useMemo } from "react";

type AttendeeListProps = {
  attendees: Attendee[];
  isLoading: boolean;
  meet: Meet | null;
  statusCounts?: { accepted: number; rejected: number; waitlisted: number };
  selectedAttendeeId: string | null;
  setSelectedAttendeeId: (attendeeId: string | null) => void;
  fullScreen?: boolean;
};

export function AttendeeList({
  attendees,
  isLoading,
  meet,
  selectedAttendeeId,
  setSelectedAttendeeId,
  fullScreen,
}: AttendeeListProps) {
  const statusCounts = useMemo(() => {
    return attendees.reduce(
      (acc, attendee) => {
        const status = attendee.status || AttendeeStatusEnum.Pending;
        if (status === AttendeeStatusEnum.Confirmed) acc.accepted += 1;
        if (
          status === AttendeeStatusEnum.Rejected ||
          status === AttendeeStatusEnum.Cancelled
        )
          acc.rejected += 1;
        if (status === AttendeeStatusEnum.Waitlisted) acc.waitlisted += 1;
        return acc;
      },
      { accepted: 0, rejected: 0, waitlisted: 0 },
    );
  }, [attendees]);

  const attendeeLabel = (attendee: Attendee) =>
    attendee?.name || attendee?.email || attendee?.phone || "Unnamed attendee";

  if (!meet) return null;

  return (
    <Paper
      variant="outlined"
      sx={{
        width: { xs: "100%", md: 280 },
        flexShrink: 0,
        ...(fullScreen && {
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          height: "100%",
        }),
      }}
    >
      <Box sx={{ p: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
        >
          <Typography variant="subtitle2" color="text.secondary">
            Attendees
          </Typography>
          <Stack direction="row" spacing={1}>
            <Chip size="small" color="success" label={statusCounts.accepted} />
            <Chip size="small" color="error" label={statusCounts.rejected} />
            <Chip
              size="small"
              color="warning"
              label={statusCounts.waitlisted}
            />
          </Stack>
        </Stack>
      </Box>
      <Divider />
      <List
        sx={{
          maxHeight: fullScreen ? "none" : { xs: 220, md: 420 },
          overflowY: "auto",
          ...(fullScreen && { flex: 1 }),
        }}
      >
        {isLoading ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Loading attendees...
            </Typography>
          </Box>
        ) : attendees.length ? (
          attendees.map((attendee) => {
            const label = attendeeLabel(attendee);
            const subLabel = attendee.email || attendee.phone || "";
            return (
              <AttendeeItem
                key={attendee.id}
                attendee={attendee}
                meet={meet}
                selectedAttendeeId={selectedAttendeeId}
                onSelect={setSelectedAttendeeId}
                label={label}
                subLabel={subLabel}
              />
            );
          })
        ) : (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No attendees yet.
            </Typography>
          </Box>
        )}
      </List>
    </Paper>
  );
}
