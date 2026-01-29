import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useParams } from "react-router-dom";
import { useFetchOrganizationTemplates } from "../hooks/useFetchOrganizationTemplates";
import { useFetchOrganization } from "../hooks/useFetchOrganization";
import { shortTimestamp } from "../helpers/formatFriendlyTimestamp";
import { useState } from "react";
import { CreateOrEditTemplateModal } from "../components/templates/CreateOrEditTemplateModal";
import { AdminActionsMenu } from "../components/AdminActionsMenu";
import { useDeleteTemplate } from "../hooks/useDeleteTemplate";
import ConfirmActionDialog from "../components/ConfirmActionDialog";

function TemplatesPage() {
  const { id } = useParams();
  const {
    data: templates,
    isLoading,
    error,
  } = useFetchOrganizationTemplates(id);
  const { data: organization } = useFetchOrganization(id);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState<string>("");
  const { deleteTemplateAsync } = useDeleteTemplate();

  const columns: GridColDef[] = [
    { field: "name", headerName: "Name", flex: 1, minWidth: 180 },
    { field: "description", headerName: "Description", flex: 2, minWidth: 240 },
    {
      field: "createdAt",
      headerName: "Created",
      flex: 1,
      minWidth: 160,
      valueFormatter: (params) =>
        params.value ? shortTimestamp(params.value as string) : "—",
    },
    {
      field: "updatedAt",
      headerName: "Updated",
      flex: 1,
      minWidth: 160,
      valueFormatter: (params) =>
        params.value ? shortTimestamp(params.value as string) : "—",
    },
    {
      field: "actions",
      headerName: "",
      sortable: false,
      filterable: false,
      width: 64,
      renderCell: (params) => (
        <AdminActionsMenu
          onEdit={() => {
            setSelectedTemplateId(params.row.id);
            setCreateOpen(true);
          }}
          onDelete={async () => {
            if (!id) return;
            setDeleteTargetId(params.row.id as string);
            setDeleteTargetName(params.row.name || "this template");
          }}
        />
      ),
    },
  ];

  const title = organization?.name
    ? `${organization.name} Templates`
    : "Templates";

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Templates available for this organization.
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => {
            setSelectedTemplateId(null);
            setCreateOpen(true);
          }}
          disabled={!id}
        >
          Create template
        </Button>
      </Box>
      <Paper sx={{ height: 520 }}>
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
            rows={templates}
            columns={columns}
            autoHeight
            disableRowSelectionOnClick
            initialState={{
              pagination: { paginationModel: { pageSize: 25, page: 0 } },
            }}
            pageSizeOptions={[10, 25, 50]}
            sx={{ border: "none" }}
          />
        )}
      </Paper>
      {id && (
        <CreateOrEditTemplateModal
          open={createOpen}
          organizationId={id}
          templateId={selectedTemplateId}
          onClose={() => {
            setCreateOpen(false);
            setSelectedTemplateId(null);
          }}
        />
      )}
      <ConfirmActionDialog
        open={Boolean(deleteTargetId)}
        title="Delete template"
        description={`Delete ${deleteTargetName}? This cannot be undone.`}
        confirmLabel="Delete"
        onClose={() => {
          setDeleteTargetId(null);
          setDeleteTargetName("");
        }}
        onConfirm={async () => {
          if (!id || !deleteTargetId) return;
          await deleteTemplateAsync({
            organizationId: id,
            templateId: deleteTargetId,
          });
          setDeleteTargetId(null);
          setDeleteTargetName("");
        }}
      />
    </Stack>
  );
}

export default TemplatesPage;
