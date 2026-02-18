import {
  Typography,
  Paper,
  Stack,
  Button,
  Box,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";
import { Heading } from "../components/Heading";
import { MeetStatus } from "../components/meet/MeetStatus";
import { MeetActionsMenu } from "../components/meet/MeetActionsMenu";
import { MeetActionsDialogs } from "../components/meet/MeetActionsDialogs";
import { useFetchMeets } from "../hooks/useFetchMeets";
import { defaultPendingAction } from "../helpers/defaultPendingAction";
import { MeetActionsEnum } from "../types/MeetActionsEnum";
import { useCurrentOrganization } from "../context/organizationContext";
import { useAuth } from "../context/authContext";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PlaceIcon from "@mui/icons-material/Place";
import SearchIcon from "@mui/icons-material/Search";

function ListPage() {
  const [selectedMeetId, setSelectedMeetId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<MeetActionsEnum | null>(
    null,
  );
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [view, setView] = useState<"all" | "draft" | "upcoming" | "past">(
    "upcoming",
  );
  const { currentOrganizationId } = useCurrentOrganization();
  const { user } = useAuth();
  const {
    data: meets,
    total,
    isLoading,
  } = useFetchMeets({
    view,
    page: paginationModel.page + 1,
    limit: paginationModel.pageSize,
    organizationId: currentOrganizationId,
    search: debouncedSearch.trim() || undefined,
  });

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: "name",
        headerName: "Name",
        flex: 1,
        minWidth: 180,
        renderCell: (params: GridRenderCellParams) => (
          <Typography fontWeight={600}>{params.value as string}</Typography>
        ),
      },
      {
        field: "startTime",
        headerName: "When",
        flex: 1,
        minWidth: 160,
        valueGetter: (value) => value.row.startTime,
        renderCell: (params: GridRenderCellParams) => (
          <Stack spacing={1} direction="row" alignItems="center">
            <AccessTimeIcon fontSize="small" color="disabled" />
            <Typography color="text.secondary" variant="body2">
              {params.value
                ? new Date(params.value as string).toLocaleDateString()
                : ""}
            </Typography>
          </Stack>
        ),
      },
      {
        field: "location",
        headerName: "Where",
        flex: 1,
        minWidth: 180,
        valueGetter: (value) => value.row.location || null,
        renderCell: (params: GridRenderCellParams) => (
          <Stack spacing={1} direction="row" alignItems="center">
            <PlaceIcon fontSize="small" color="disabled" />
            <Typography color="text.secondary" variant="body2">
              {params.value as string}
            </Typography>
          </Stack>
        ),
      },
      {
        field: "status",
        headerName: "Status",
        flex: 0.6,
        minWidth: 140,
        sortable: true,
        headerAlign: "center",
        align: "center",
        valueGetter: (value) => value.row.statusId ?? null,
        renderCell: (params: GridRenderCellParams) => (
          <MeetStatus
            statusId={params.value as number | undefined}
            fallbackLabel={params.row.status || "Unknown"}
          />
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        flex: 0.5,
        minWidth: 120,
        sortable: false,
        filterable: false,
        hideable: false,
        headerAlign: "right",
        align: "right",
        renderCell: (params: GridRenderCellParams) => (
          <Box
            sx={{ display: "flex", justifyContent: "flex-end", width: "100%" }}
            onClick={(event) => event.stopPropagation()}
          >
            <MeetActionsMenu
              meetId={params.row.id}
              statusId={params.row.statusId}
              isOrganizer={params.row.organizerId === user?.id}
              setSelectedMeetId={setSelectedMeetId}
              setPendingAction={setPendingAction}
            />
          </Box>
        ),
      },
    ],
    [setPendingAction, setSelectedMeetId, user?.id],
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPaginationModel((prev) =>
        prev.page === 0 ? prev : { ...prev, page: 0 },
      );
    }, 500);
    return () => window.clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => {
    setPaginationModel((prev) =>
      prev.page === 0 ? prev : { ...prev, page: 0 },
    );
  }, [view]);

  return (
    <Stack spacing={2}>
      <Heading
        title="Meets List"
        subtitle="Manage all meets from one place."
        actionComponent={
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
          >
            <ToggleButtonGroup
              exclusive
              size="small"
              value={view}
              onChange={(_event, nextView) => {
                if (nextView) setView(nextView);
              }}
            >
              <ToggleButton value="draft">Draft</ToggleButton>
              <ToggleButton value="upcoming">Upcoming</ToggleButton>
              <ToggleButton value="past">Past</ToggleButton>
            </ToggleButtonGroup>
            <TextField
              size="small"
              variant="standard"
              placeholder="Search meets"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              sx={{ minWidth: 350 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon fontSize="small" color="disabled" />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              onClick={() => {
                setPendingAction(MeetActionsEnum.Create);
              }}
            >
              New meet
            </Button>
          </Stack>
        }
      />
      <Paper variant="outlined" sx={{ width: "100%", bgcolor: "transparent" }}>
        <DataGrid
          autoHeight
          rows={meets}
          columns={columns}
          getRowId={(row) => row.id}
          loading={isLoading}
          pagination
          paginationMode="server"
          rowCount={total}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          disableColumnFilter
          disableRowSelectionOnClick
          onRowClick={(params) => {
            setSelectedMeetId(params.row.id);
            setPendingAction(defaultPendingAction(params.row.statusId));
          }}
          sx={(theme) => ({
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(16, 16, 16, 0.7)"
                : "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            "& .MuiDataGrid-cell:first-of-type": {
              pl: 2,
            },
            "& .MuiDataGrid-cell:last-of-type": {
              pr: 2,
            },
            "& .MuiDataGrid-columnHeader:first-of-type": {
              pl: 2,
            },
            "& .MuiDataGrid-columnHeader:last-of-type": {
              pr: 2,
            },
          })}
          slots={{
            noRowsOverlay: () => (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  No meets found.
                </Typography>
              </Box>
            ),
          }}
        />
      </Paper>
      <MeetActionsDialogs
        meetId={selectedMeetId}
        pendingAction={pendingAction || undefined}
        setPendingAction={setPendingAction}
        setSelectedMeetId={setSelectedMeetId}
      />
    </Stack>
  );
}

export default ListPage;
