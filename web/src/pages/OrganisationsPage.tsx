import {
  Box,
  CircularProgress,
  Link,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useMemo, useState } from "react";
import { useFetchOrganisations } from "../hooks/useFetchOrganisations";
import { Link as RouterLink } from "react-router-dom";
import { Organization } from "../types/OrganizationModel";
import { formatFriendlyTimestamp } from "../helpers/formatFriendlyTimestamp";
import { useAuth } from "../context/authContext";
import { RoleChip } from "../components/RoleChip";
import { OrganizationActions } from "../components/OrganizationActions";

type OrgRow = Organization & { role?: string };

function OrganisationsPage() {
  const { user } = useAuth();
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });
  const [sortModel, setSortModel] = useState<
    Array<{ field: string; sort: "asc" | "desc" }>
  >([{ field: "name", sort: "asc" }]);

  const {
    data: organizations,
    total,
    isLoading,
    error,
  } = useFetchOrganisations({
    page: paginationModel.page + 1,
    limit: paginationModel.pageSize,
    sortBy: sortModel[0]?.field,
    sortOrder: sortModel[0]?.sort,
  });

  const rows = useMemo<OrgRow[]>(() => {
    const orgRoles = user?.organizations || {};
    return organizations.map((org) => ({
      ...org,
      role: orgRoles[org.id] || "member",
    }));
  }, [organizations, user?.organizations]);
  const rowCount = total || rows.length;
  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: "name",
        headerName: "Name",
        flex: 1,
        minWidth: 200,
      },
      {
        field: "role",
        headerName: "",
        flex: 0.3,
        minWidth: 120,
        headerAlign: "center",
        align: "center",
        sortable: false,
        renderCell: (params: GridRenderCellParams) => (
          <RoleChip role={params.value as string} />
        ),
      },
      {
        field: "userCount",
        headerName: "Users",
        flex: 0.4,
        minWidth: 110,
        headerAlign: "right",
        align: "right",
        renderCell: (params: GridRenderCellParams) => (
          <Link
            component={RouterLink}
            to={`/admin/organizations/${params.row.id}/members`}
            underline="hover"
            aria-disabled={params.row.role !== "admin"}
            sx={
              params.row.role !== "admin"
                ? { color: "text.disabled", pointerEvents: "none" }
                : undefined
            }
          >
            {params.value ?? 0}
          </Link>
        ),
      },
      {
        field: "templateCount",
        headerName: "Templates",
        flex: 0.5,
        minWidth: 120,
        headerAlign: "right",
        align: "right",
        renderCell: (params: GridRenderCellParams) => (
          <Link
            component={RouterLink}
            to={`/admin/organizations/${params.row.id}/templates`}
            underline="hover"
            aria-disabled={params.row.role !== "admin"}
            sx={
              params.row.role !== "admin"
                ? { color: "text.disabled", pointerEvents: "none" }
                : undefined
            }
          >
            {params.value ?? 0}
          </Link>
        ),
      },
      {
        field: "createdAt",
        headerName: "Created",
        flex: 0.6,
        minWidth: 160,
        valueFormatter: (params) =>
          params.value ? formatFriendlyTimestamp(params.value as string) : "—",
      },
      {
        field: "actions",
        headerName: "Actions",
        flex: 0.4,
        minWidth: 140,
        sortable: false,
        filterable: false,
        headerAlign: "right",
        align: "right",
        renderCell: (params: GridRenderCellParams) => (
          <OrganizationActions
            organizationId={params.row.id}
            disabled={params.row.role !== "admin"}
          />
        ),
      },
    ],
    []
  );

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={700}>
          Organisations
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage organisations available to your account.
        </Typography>
      </Box>
      <Paper>
        {isLoading ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 240,
            }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          <DataGrid
            autoHeight
            rows={rows}
            columns={columns}
            getRowId={(row) => row.id}
            rowCount={rowCount}
            loading={isLoading}
            pagination
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50]}
            sortingMode="server"
            sortModel={sortModel}
            onSortModelChange={(model) =>
              setSortModel(model as Array<{ field: string; sort: "asc" | "desc" }>)
            }
            disableRowSelectionOnClick
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
                  <Typography color="text.secondary">
                    No organisations found.
                  </Typography>
                </Box>
              ),
            }}
          />
        )}
      </Paper>
    </Stack>
  );
}

export default OrganisationsPage;
