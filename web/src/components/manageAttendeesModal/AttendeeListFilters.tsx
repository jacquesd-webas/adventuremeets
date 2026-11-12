import { useMemo } from "react";
import {
  Box,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined";
import type { Attendee } from "../../types/AttendeeModel";
import { attendeeTagChipColors } from "../../helpers/attendeeTagColors";

export type AttendeeStatusGroup = "accepted" | "rejected" | "waitlisted";

export type AttendeeListFilterState = {
  searchOpen: boolean;
  search: string;
  status: AttendeeStatusGroup | null;
  tag: string | null;
};

export const emptyAttendeeListFilters: AttendeeListFilterState = {
  searchOpen: false,
  search: "",
  status: null,
  tag: null,
};

type AttendeeListFiltersProps = {
  attendees: Attendee[];
  statusCounts: Record<AttendeeStatusGroup, number>;
  filters: AttendeeListFilterState;
  onChange: (filters: AttendeeListFilterState) => void;
};

export function AttendeeListFilters({
  attendees,
  statusCounts,
  filters,
  onChange,
}: AttendeeListFiltersProps) {
  const tags = useMemo(
    () =>
      [...new Set(attendees.flatMap((attendee) => attendee.tags ?? []))].sort(
        (a, b) => a.localeCompare(b),
      ),
    [attendees],
  );

  return (
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
          <Tooltip
            title={filters.searchOpen ? "Clear filters" : "Search attendees"}
          >
            <IconButton
              size="small"
              aria-label={
                filters.searchOpen
                  ? "Clear attendee filters"
                  : "Search attendees"
              }
              onClick={() =>
                onChange(
                  filters.searchOpen
                    ? emptyAttendeeListFilters
                    : { ...filters, searchOpen: true },
                )
              }
            >
              {filters.searchOpen ? (
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
                  filters.status && filters.status !== group
                    ? "outlined"
                    : "filled"
                }
                aria-label={`Filter ${label.toLowerCase()} attendees`}
                aria-pressed={filters.status === group}
                onClick={() =>
                  onChange({
                    ...filters,
                    status: filters.status === group ? null : group,
                  })
                }
              />
            </Tooltip>
          ))}
        </Stack>
      </Stack>
      {filters.searchOpen ? (
        <>
          <TextField
            autoFocus
            fullWidth
            size="small"
            variant="standard"
            placeholder="Search attendees"
            inputProps={{ "aria-label": "Search attendees" }}
            value={filters.search}
            onChange={(event) =>
              onChange({ ...filters, search: event.target.value })
            }
            sx={{ mt: 1 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon fontSize="small" color="disabled" />
                </InputAdornment>
              ),
            }}
          />
          {tags.length ? (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  variant="outlined"
                  aria-label={`Filter by tag ${tag}`}
                  aria-pressed={filters.tag === tag}
                  onClick={() =>
                    onChange({
                      ...filters,
                      tag: filters.tag === tag ? null : tag,
                    })
                  }
                  sx={{
                    ...attendeeTagChipColors(tag),
                    height: 18,
                    fontSize: 10,
                    fontWeight: filters.tag === tag ? 700 : 400,
                    boxShadow:
                      filters.tag === tag ? "0 0 0 1px currentColor" : "none",
                    "& .MuiChip-label": { px: 0.75 },
                  }}
                />
              ))}
            </Box>
          ) : null}
        </>
      ) : null}
    </Box>
  );
}
