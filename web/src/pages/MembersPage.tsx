import {
  Box,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useFetchOrganizationMembers } from "../hooks/useFetchOrganizationMembers";
import { useFetchOrganization } from "../hooks/useFetchOrganization";
import { shortTimestamp } from "../helpers/formatFriendlyTimestamp";
import { RoleChip } from "../components/RoleChip";
import { EditUsersModal } from "../components/admin/EditUsersModal";
import { OrganizationMember } from "../types/MemberModel";
import { AdminActionsMenu } from "../components/AdminActionsMenu";

function MembersPage() {
  const { id } = useParams();
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });
  const [selectedMember, setSelectedMember] =
    useState<OrganizationMember | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [sortModel, setSortModel] = useState<
    Array<{ field: string; sort: "asc" | "desc" }>
  >([{ field: "firstName", sort: "asc" }]);
  const { data: members, isLoading, error } = useFetchOrganizationMembers(id);
  const { data: organization } = useFetchOrganization(id);
  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: "firstName",
        headerName: "Name",
        flex: 1,
        minWidth: 200,
        valueGetter: (value) =>
          [value.row.firstName, value.row.lastName].filter(Boolean).join(" ") ||
          "—",
      },
      {
        field: "email",
        headerName: "Email",
        flex: 1,
        minWidth: 220,
        valueGetter: (value) => value.row.email || "—",
      },
      {
        field: "role",
        headerName: "Role",
        flex: 0.6,
        minWidth: 140,
        headerAlign: "center",
        align: "center",
        renderCell: (params: GridRenderCellParams) => (
          <RoleChip role={(params.value as string) || "member"} />
        ),
      },
      {
        field: "status",
        headerName: "Status",
        flex: 0.6,
        minWidth: 140,
        headerAlign: "center",
        align: "center",
        renderCell: (params: GridRenderCellParams) => {
          const isActive = (params.value as string)?.toLowerCase() === "active";
          const color = isActive ? "success" : "default";
          return (
            <Chip
              size="small"
              label={params.value || "Unknown"}
              color={color}
              variant="outlined"
              sx={{
                color: isActive ? "success.main" : "text.disabled",
                borderColor: isActive ? "success.main" : "text.disabled",
              }}
            />
          );
        },
      },
      {
        field: "createdAt",
        headerName: "Joined",
        flex: 0.7,
        minWidth: 160,
        valueFormatter: (params) =>
          params.value ? shortTimestamp(params.value as string) : "—",
      },
      {
        field: "actions",
        headerName: "Actions",
        flex: 0.4,
        minWidth: 120,
        sortable: false,
        filterable: false,
        align: "right",
        headerAlign: "right",
        renderCell: (params: GridRenderCellParams) => (
          <AdminActionsMenu
            onEdit={() => {
              setSelectedMember(params.row as OrganizationMember);
              setIsEditOpen(true);
            }}
          />
        ),
      },
    ],
    []
  );

  const title = organization?.name ? `${organization.name} Members` : "Members";

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={700}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Organization members and roles.
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
            rows={members}
            columns={columns}
            getRowId={(row) => row.id}
            loading={isLoading}
            pagination
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50]}
            sortingMode="client"
            sortModel={sortModel}
            onSortModelChange={(model) =>
              setSortModel(
                model as Array<{ field: string; sort: "asc" | "desc" }>
              )
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
                    No members found.
                  </Typography>
                </Box>
              ),
            }}
          />
        )}
      </Paper>
      <EditUsersModal
        open={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
        organizationId={id}
      />
    </Stack>
  );
}

export default MembersPage;
