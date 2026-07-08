import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Popover,
  Stack,
  Typography,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import { useMeetStatusLookup } from "../../hooks/useFetchMeetStatuses";
import MeetStatusEnum from "../../types/MeetStatusEnum";
import { MeetStatus } from "./MeetStatus";

type CalendarStatusFilterProps = {
  value: number[];
  onChange: (next: number[]) => void;
};

const statusOptions = [
  MeetStatusEnum.Published,
  MeetStatusEnum.Open,
  MeetStatusEnum.Closed,
  MeetStatusEnum.Cancelled,
  MeetStatusEnum.Postponed,
  MeetStatusEnum.Completed,
];

export function CalendarStatusFilter({
  value,
  onChange,
}: CalendarStatusFilterProps) {
  const { getName } = useMeetStatusLookup();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);

  const selectedCount = value.length;
  const allSelected = selectedCount === statusOptions.length;

  const labels = useMemo(
    () =>
      Object.fromEntries(
        statusOptions.map((statusId) => [
          statusId,
          getName(statusId, "Unknown"),
        ]),
      ),
    [getName],
  );

  const toggleStatus = (statusId: number) => {
    if (value.includes(statusId)) {
      onChange(value.filter((current) => current !== statusId));
      return;
    }
    onChange([...value, statusId]);
  };

  const handleToggleAll = () => {
    onChange(allSelected ? [] : [...statusOptions]);
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<FilterListIcon />}
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        {allSelected ? "Statuses" : `Statuses (${selectedCount})`}
      </Button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <Stack spacing={1.25} sx={{ p: 1.5, minWidth: 260 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            Show statuses
          </Typography>
          <FormControlLabel
            control={
              <Checkbox checked={allSelected} onChange={handleToggleAll} />
            }
            label="All statuses"
            sx={{ mr: 0 }}
          />
          {statusOptions.map((statusId) => (
            <FormControlLabel
              key={statusId}
              control={
                <Checkbox
                  checked={value.includes(statusId)}
                  onChange={() => toggleStatus(statusId)}
                />
              }
              label={
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <MeetStatus
                    statusId={statusId}
                    fallbackLabel={labels[statusId] ?? "Unknown"}
                  />
                </Box>
              }
              sx={{ mr: 0 }}
            />
          ))}
        </Stack>
      </Popover>
    </>
  );
}
