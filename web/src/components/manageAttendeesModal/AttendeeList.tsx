import { Box, Divider, List, Paper, Typography } from "@mui/material";
import { Meet } from "../../types/MeetModel";
import { Attendee } from "../../types/AttendeeModel";
import { AttendeeItem } from "./AttendeeItem";
import { AttendeeStatusEnum } from "../../types/AttendeeStatusEnum";
import { useMemo, useState } from "react";
import { ManageAttendeesSectionLoading } from "./ManageAttendeesSectionLoading";
import {
  AttendeeListFilters,
  AttendeeListFilterState,
  AttendeeStatusGroup,
  emptyAttendeeListFilters,
} from "./AttendeeListFilters";

type AttendeeListProps = {
  attendees: Attendee[];
  isLoading: boolean;
  meet: Meet | null;
  statusCounts?: { accepted: number; rejected: number; waitlisted: number };
  selectedAttendeeId: string | null;
  setSelectedAttendeeId: (attendeeId: string | null) => void;
  fullScreen?: boolean;
};

function getStatusGroup(
  status: AttendeeStatusEnum,
): AttendeeStatusGroup | null {
  if (
    status === AttendeeStatusEnum.Confirmed ||
    status === AttendeeStatusEnum.CheckedIn ||
    status === AttendeeStatusEnum.Attended
  ) {
    return "accepted";
  }
  if (
    status === AttendeeStatusEnum.Rejected ||
    status === AttendeeStatusEnum.Cancelled
  ) {
    return "rejected";
  }
  if (status === AttendeeStatusEnum.Waitlisted) return "waitlisted";
  return null;
}

export function AttendeeList({
  attendees,
  isLoading,
  meet,
  selectedAttendeeId,
  setSelectedAttendeeId,
  fullScreen,
}: AttendeeListProps) {
  const [filters, setFilters] = useState<AttendeeListFilterState>(
    emptyAttendeeListFilters,
  );
  const statusCounts = useMemo(() => {
    return attendees.reduce(
      (acc, attendee) => {
        const group = getStatusGroup(attendee.status);
        const count = 1 + (attendee.guests ?? 0);
        if (group) acc[group] += count;
        return acc;
      },
      { accepted: 0, rejected: 0, waitlisted: 0 },
    );
  }, [attendees]);
  const filteredAttendees = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    if (!query && !filters.status && !filters.tag) return attendees;
    return attendees.filter((attendee) => {
      if (
        filters.status &&
        getStatusGroup(attendee.status) !== filters.status
      ) {
        return false;
      }
      if (filters.tag && !attendee.tags?.includes(filters.tag)) return false;
      if (!query) return true;
      return [
        attendee.name,
        attendee.email,
        attendee.phone,
        attendee.guardianName,
        ...(attendee.guestsList?.map((guest) => guest.name) ?? []),
      ].some((value) => value?.toLowerCase().includes(query));
    });
  }, [attendees, filters]);

  const attendeeLabel = (attendee: Attendee) =>
    attendee?.name || attendee?.email || attendee?.phone || "Unnamed attendee";

  if (!meet) return null;

  return (
    <Paper
      variant="outlined"
      sx={{
        width: { xs: "100%", md: 280 },
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        height: "100%",
        overflow: "hidden",
        ...(fullScreen && {
          flex: 1,
        }),
      }}
    >
      <AttendeeListFilters
        attendees={attendees}
        statusCounts={statusCounts}
        filters={filters}
        onChange={setFilters}
      />
      <Divider />
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
        }}
      >
        <List sx={{ py: 0 }}>
          {isLoading ? (
            <Box sx={{ p: 2 }}>
              <ManageAttendeesSectionLoading label="Loading attendees..." />
            </Box>
          ) : filteredAttendees.length ? (
            filteredAttendees.map((attendee) => {
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
                {attendees.length
                  ? "No attendees match your filters."
                  : "No attendees yet."}
              </Typography>
            </Box>
          )}
        </List>
      </Box>
    </Paper>
  );
}
