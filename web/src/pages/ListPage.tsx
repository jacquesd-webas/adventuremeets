import {
  Typography,
  Paper,
  Stack,
  Button,
  Box,
  TextField,
  InputAdornment,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Heading } from "../components/Heading";
import { MeetStatus } from "../components/meet/MeetStatus";
import { MeetActionsMenu } from "../components/meet/MeetActionsMenu";
import { MeetActionsDialogs } from "../components/meet/MeetActionsDialogs";
import { MeetFilterButtonGroup } from "../components/meet/MeetFilterButtonGroup";
import { useFetchMeets } from "../hooks/useFetchMeets";
import { defaultPendingAction } from "../helpers/defaultPendingAction";
import { MeetActionsEnum } from "../types/MeetActionsEnum";
import { useCurrentOrganization } from "../context/organizationContext";
import { useFilters } from "../context/filterContext";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PlaceIcon from "@mui/icons-material/Place";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import { MainLayoutOutletContext } from "../layout/MainLayout";
import { useAuth } from "../context/authContext";
import { getMeetPermissions } from "../helpers/meetPermissions";

function ListPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(820));
  const { setMobileHeaderAction } = useOutletContext<MainLayoutOutletContext>();
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
  const { currentOrganizationId, currentOrganizationRole } =
    useCurrentOrganization();
  const { user } = useAuth();
  const { listPageView, setListPageView } = useFilters();
  const canManageMeets =
    currentOrganizationRole === "organizer" ||
    currentOrganizationRole === "admin";
  const {
    data: meets,
    total,
    isLoading,
  } = useFetchMeets({
    view: listPageView,
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
          (() => {
            const { canManageMeet, canViewMeet } = getMeetPermissions({
              currentUserId: user?.id,
              currentOrganizationRole,
              organizerId: params.row.organizerId,
            });

            return (
              <Box
                sx={{ display: "flex", justifyContent: "flex-end", width: "100%" }}
                onClick={(event) => event.stopPropagation()}
              >
                <MeetActionsMenu
                  meetId={params.row.id}
                  statusId={params.row.statusId}
                  canViewMeet={canViewMeet}
                  canManageMeet={canManageMeet}
                  setSelectedMeetId={setSelectedMeetId}
                  setPendingAction={setPendingAction}
                  previewLinkCode={params.row.shareCode}
                />
              </Box>
            );
          })()
        ),
      },
    ],
    [currentOrganizationRole, setPendingAction, setSelectedMeetId, user?.id],
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
  }, [listPageView]);

  const handleNewMeet = useCallback(() => {
    if (!canManageMeets) return;
    setPendingAction(MeetActionsEnum.Create);
  }, [canManageMeets, setPendingAction]);

  useEffect(() => {
    if (!isMobile) {
      setMobileHeaderAction(null);
      return;
    }
    if (!canManageMeets) {
      setMobileHeaderAction(null);
      return;
    }
    setMobileHeaderAction(
      <Button
        variant="text"
        color="inherit"
        size="small"
        startIcon={<AddIcon />}
        onClick={handleNewMeet}
        sx={{ textTransform: "none", whiteSpace: "nowrap", minWidth: 0, px: 1 }}
      >
        NEW MEET
      </Button>,
    );
    return () => setMobileHeaderAction(null);
  }, [canManageMeets, handleNewMeet, isMobile, setMobileHeaderAction]);

  const totalPages = Math.max(1, Math.ceil(total / paginationModel.pageSize));
  const currentPage = paginationModel.page + 1;
  const selectedMeetPermissions = useMemo(() => {
    if (pendingAction === MeetActionsEnum.Create) {
      return {
        isOrganizerForMeet: true,
        canManageMeet: true,
        canViewMeet: false,
      };
    }

    const selectedMeet = meets.find((meet) => meet.id === selectedMeetId);
    if (!selectedMeet) {
      return {
        isOrganizerForMeet: false,
        canManageMeet: false,
        canViewMeet: false,
      };
    }

    return getMeetPermissions({
      currentUserId: user?.id,
      currentOrganizationRole,
      organizerId: selectedMeet.organizerId,
    });
  }, [currentOrganizationRole, meets, pendingAction, selectedMeetId, user?.id]);

  return (
    <Stack spacing={2}>
      <Heading
        title="Meets List"
        subtitle="Manage all meets from one place."
        actionComponent={
          <Stack
            direction="row"
            spacing={1}
            alignItems={isMobile ? "stretch" : "center"}
            flexWrap="wrap"
            sx={{ width: isMobile ? "100%" : "auto" }}
          >
            <MeetFilterButtonGroup
              isMobile={isMobile}
              value={listPageView}
              onChange={setListPageView}
            />
            {!isMobile && canManageMeets && (
              <Button
                variant="contained"
                onClick={handleNewMeet}
                sx={{ width: "auto" }}
              >
                New meet
              </Button>
            )}
          </Stack>
        }
      />
      {isMobile && (
        <TextField
          size="small"
          variant="standard"
          placeholder="Search meets"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          sx={{ width: "100%" }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon fontSize="small" color="disabled" />
              </InputAdornment>
            ),
          }}
        />
      )}
      {!isMobile ? (
        <Paper
          variant="outlined"
          sx={{ width: "100%", bgcolor: "transparent" }}
        >
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
      ) : (
        <Stack spacing={1.5}>
          {meets.length === 0 && !isLoading && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No meets found.
              </Typography>
            </Paper>
          )}
          {meets.map((meet) => (
            (() => {
              const { canManageMeet, canViewMeet } = getMeetPermissions({
                currentUserId: user?.id,
                currentOrganizationRole,
                organizerId: meet.organizerId,
              });

              return (
                <Paper
                  key={meet.id}
                  variant="outlined"
                  onClick={() => {
                    setSelectedMeetId(meet.id);
                    setPendingAction(defaultPendingAction(meet.statusId));
                  }}
                  sx={{
                    p: 1.5,
                    cursor: "pointer",
                  }}
                >
                  <Stack spacing={1.25}>
                    <Stack
                      direction="row"
                      alignItems="flex-start"
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Typography fontWeight={600}>{meet.name}</Typography>
                      <Box onClick={(event) => event.stopPropagation()}>
                        <MeetActionsMenu
                          meetId={meet.id}
                          statusId={meet.statusId}
                          canViewMeet={canViewMeet}
                          canManageMeet={canManageMeet}
                          setSelectedMeetId={setSelectedMeetId}
                          setPendingAction={setPendingAction}
                          previewLinkCode={meet.shareCode || undefined}
                        />
                      </Box>
                    </Stack>
                    <Stack spacing={1} direction="row" alignItems="center">
                      <AccessTimeIcon fontSize="small" color="disabled" />
                      <Typography color="text.secondary" variant="body2">
                        {meet.startTime
                          ? new Date(meet.startTime).toLocaleDateString()
                          : ""}
                      </Typography>
                    </Stack>
                    <Stack spacing={1} direction="row" alignItems="center">
                      <PlaceIcon fontSize="small" color="disabled" />
                      <Typography color="text.secondary" variant="body2">
                        {meet.location}
                      </Typography>
                    </Stack>
                    <Box>
                      <MeetStatus
                        statusId={meet.statusId}
                        fallbackLabel={meet.status || "Unknown"}
                      />
                    </Box>
                  </Stack>
                </Paper>
              );
            })()
          ))}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Button
              variant="outlined"
              onClick={() =>
                setPaginationModel((prev) => ({
                  ...prev,
                  page: Math.max(0, prev.page - 1),
                }))
              }
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <Typography variant="body2" color="text.secondary">
              Page {currentPage} of {totalPages}
            </Typography>
            <Button
              variant="outlined"
              onClick={() =>
                setPaginationModel((prev) => ({
                  ...prev,
                  page: Math.min(totalPages - 1, prev.page + 1),
                }))
              }
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </Stack>
        </Stack>
      )}
      <MeetActionsDialogs
        meetId={selectedMeetId}
        canViewMeet={selectedMeetPermissions.canViewMeet}
        canManageMeet={selectedMeetPermissions.canManageMeet}
        pendingAction={pendingAction || undefined}
        setPendingAction={setPendingAction}
        setSelectedMeetId={setSelectedMeetId}
      />
    </Stack>
  );
}

export default ListPage;
