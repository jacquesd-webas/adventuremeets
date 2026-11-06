import {
  Box,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  List,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined";
import { Meet } from "../../types/MeetModel";
import { Attendee } from "../../types/AttendeeModel";
import { AttendeeItem } from "./AttendeeItem";
import { AttendeeStatusEnum } from "../../types/AttendeeStatusEnum";
import { useMemo, useState } from "react";
import { ManageAttendeesSectionLoading } from "./ManageAttendeesSectionLoading";

type AttendeeListProps = {
  attendees: Attendee[];
  isLoading: boolean;
  meet: Meet | null;
  statusCounts?: { accepted: number; rejected: number; waitlisted: number };
  selectedAttendeeId: string | null;
  setSelectedAttendeeId: (attendeeId: string | null) => void;
  fullScreen?: boolean;
};

type StatusGroup = "accepted" | "rejected" | "waitlisted";

function getStatusGroup(status: AttendeeStatusEnum): StatusGroup | null {
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusGroup | null>(null);
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
    const query = search.trim().toLowerCase();
    if (!query && !statusFilter) return attendees;
    return attendees.filter((attendee) => {
      if (statusFilter && getStatusGroup(attendee.status) !== statusFilter) {
        return false;
      }
      if (!query) return true;
      return [
        attendee.name,
        attendee.email,
        attendee.phone,
        attendee.guardianName,
        ...(attendee.guestsList?.map((guest) => guest.name) ?? []),
      ].some((value) => value?.toLowerCase().includes(query));
    });
  }, [attendees, search, statusFilter]);

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
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Tooltip title={searchOpen ? "Clear filters" : "Search attendees"}>
              <IconButton
                size="small"
                aria-label={
                  searchOpen ? "Clear attendee filters" : "Search attendees"
                }
                onClick={() => {
                  if (searchOpen) {
                    setSearch("");
                    setStatusFilter(null);
                    setSearchOpen(false);
                  } else {
                    setSearchOpen(true);
                  }
                }}
              >
                {searchOpen ? (
                  <FilterAltOffOutlinedIcon fontSize="small" />
                ) : (
                  <SearchIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            {(
              [
                { group: "accepted", color: "success", label: "Accepted" },
                { group: "rejected", color: "error", label: "Rejected" },
                { group: "waitlisted", color: "warning", label: "Waitlisted" },
              ] as const
            ).map(({ group, color, label }) => (
              <Tooltip key={group} title={label}>
                <Chip
                  size="small"
                  color={color}
                  label={statusCounts[group]}
                  variant={
                    statusFilter && statusFilter !== group
                      ? "outlined"
                      : "filled"
                  }
                  aria-label={`Filter ${label.toLowerCase()} attendees`}
                  aria-pressed={statusFilter === group}
                  onClick={() =>
                    setStatusFilter((current) =>
                      current === group ? null : group,
                    )
                  }
                />
              </Tooltip>
            ))}
          </Stack>
        </Stack>
        {searchOpen && (
          <TextField
            autoFocus
            fullWidth
            size="small"
            variant="standard"
            placeholder="Search attendees"
            inputProps={{ "aria-label": "Search attendees" }}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ mt: 1 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon fontSize="small" color="disabled" />
                </InputAdornment>
              ),
            }}
          />
        )}
      </Box>
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
