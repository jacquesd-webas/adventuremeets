import { useState } from "react";
import { Alert, Button, Chip, InputAdornment, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { DataTable } from "../DataTable";
import { MeetStatus } from "../meet/MeetStatus";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SearchIcon from "@mui/icons-material/Search";
import { type GridColDef } from "@mui/x-data-grid";
import { useReportQuery } from "../../hooks/useReportQuery";
import type { ReportRow, ReportType } from "../../types/Report";
import AttendeeStatusEnum from "../../types/AttendeeStatusEnum";

export function ReportResults({ organizationId, type }: { organizationId: string; type: ReportType }) {
  const [filters, setFilters] = useState({ search: "", status: "", startDate: "", endDate: "" });
  const [pagination, setPagination] = useState({ page: 0, pageSize: 10 });
  const invalidDates = Boolean(filters.startDate && filters.endDate && filters.startDate > filters.endDate);
  const query = useReportQuery({ ...filters, organizationId, type, page: pagination.page + 1, limit: pagination.pageSize }, !invalidDates);
  const attendees = type === "attendees";
  const statuses = attendees ? Object.values(AttendeeStatusEnum) : ["Draft", "Published", "Open", "Closed", "Cancelled", "Postponed", "Completed"];
  const updateFilter = (key: keyof typeof filters, value: string) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setPagination((previous) => ({ ...previous, page: 0 }));
  };
  const columns: GridColDef<ReportRow>[] = [
    ...(attendees ? [
      { field: "attendeeName", headerName: "Attendee", flex: 1, minWidth: 180 },
      { field: "email", headerName: "Email", flex: 1, minWidth: 200 },
    ] : []),
    {
      field: "meetName", headerName: "Meet", flex: 1, minWidth: 180,
      renderCell: ({ value }) => <Typography fontWeight={600}>{value}</Typography>,
    },
    ...(!attendees ? [{ field: "organizerName", headerName: "Organiser", flex: 1, minWidth: 180 }] : []),
    {
      field: "startTime", headerName: "Meet date", width: 180,
      renderCell: ({ value }) => (
        <Stack spacing={1} direction="row" alignItems="center">
          <AccessTimeIcon fontSize="small" color="disabled" />
          <Typography color="text.secondary" variant="body2">
            {value ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) : "TBC"}
          </Typography>
        </Stack>
      ),
    },
    {
      field: "status", headerName: "Status", width: 135,
      headerAlign: "center", align: "center",
      renderCell: ({ value }) => attendees
        ? <Chip size="small" label={String(value).replaceAll("-", " ")} sx={{ textTransform: "capitalize" }} />
        : <MeetStatus fallbackLabel={String(value)} />,
    },
    ...(!attendees ? [
      { field: "applied", headerName: "Applied", type: "number", width: 100 },
      { field: "attended", headerName: "Attended", type: "number", width: 100 },
    ] : []),
  ];
  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack spacing={2}>
          <TextField
            label="Search" value={filters.search}
            placeholder={attendees ? "Search attendees, email or meet name" : "Search meets or organisers"}
            onChange={(event) => updateFilter("search", event.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            inputProps={{ maxLength: 200 }} size="small" fullWidth
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField select label={attendees ? "Attendee status" : "Meet status"} value={filters.status} onChange={(event) => updateFilter("status", event.target.value)} size="small" sx={{ flex: 1, minWidth: 160 }}>
              <MenuItem value="">All statuses</MenuItem>
              {statuses.map((status) => <MenuItem key={status} value={status} sx={{ textTransform: "capitalize" }}>{status.replaceAll("-", " ")}</MenuItem>)}
            </TextField>
            <TextField type="date" label="From" value={filters.startDate} onChange={(event) => updateFilter("startDate", event.target.value)} InputLabelProps={{ shrink: true }} size="small" sx={{ flex: 1 }} />
            <TextField type="date" label="To" value={filters.endDate} onChange={(event) => updateFilter("endDate", event.target.value)} InputLabelProps={{ shrink: true }} size="small" sx={{ flex: 1 }} error={invalidDates} />
            <Button onClick={() => { setFilters({ search: "", status: "", startDate: "", endDate: "" }); setPagination({ page: 0, pageSize: 10 }); }}>Clear filters</Button>
          </Stack>
        </Stack>
      </Paper>
      {invalidDates && <Alert severity="warning">The end date must be on or after the start date.</Alert>}
      {query.isError && <Alert severity="error" action={<Button color="inherit" onClick={() => query.refetch()}>Retry</Button>}>{query.error.message}</Alert>}
      {!attendees && <Typography variant="body2" color="text.secondary">Applied counts registrations excluding unanswered invitations, including walk-ins. Attended counts checked-in and attended records.</Typography>}
      <DataTable
        rows={invalidDates || query.isError ? [] : query.data?.rows ?? []}
        columns={columns.map((column) => ({ ...column, sortable: false }))}
        loading={query.isFetching}
        rowCount={query.data?.total ?? 0}
        paginationModel={pagination}
        onPaginationModelChange={setPagination}
        localeText={{ noRowsLabel: "No results. Try adjusting your search or filters." }}
      />
    </Stack>
  );
}
