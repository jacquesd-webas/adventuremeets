import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useCurrentOrganization } from "../../context/organizationContext";
import { useFetchOrganization } from "../../hooks/useFetchOrganization";
import { useUpdateOrganization } from "../../hooks/useUpdateOrganization";

export function OrganizationFields() {
  const { currentOrganizationId, currentOrganizationRole } =
    useCurrentOrganization();
  const { data: organization } = useFetchOrganization(
    currentOrganizationId ?? undefined,
  );
  const {
    updateOrganizationAsync,
    isLoading: isSaving,
    error: saveError,
  } = useUpdateOrganization(currentOrganizationId ?? undefined);
  const [customField1Name, setCustomField1Name] = useState("");
  const [customField2Name, setCustomField2Name] = useState("");
  const [saved, setSaved] = useState(false);
  const isAdmin = currentOrganizationRole === "admin";

  useEffect(() => {
    if (!organization) return;
    setCustomField1Name(organization.customField1Name ?? "");
    setCustomField2Name(organization.customField2Name ?? "");
  }, [organization]);

  const handleSave = async () => {
    if (!organization) return;
    await updateOrganizationAsync({
      id: organization.id,
      name: organization.name,
      theme: organization.theme || undefined,
      isPrivate: organization.isPrivate,
      canViewAllMeets: organization.canViewAllMeets ?? true,
      customField1Name: customField1Name.trim(),
      customField2Name: customField2Name.trim(),
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  };

  return (
    <Stack
      spacing={2}
      sx={{ minHeight: 320, display: "flex" }}
      alignItems="flex-start"
    >
      <Box>
        <Typography variant="h6">Fields</Typography>
        <Typography variant="body2" color="text.secondary">
          Set the organisation-specific names used for the two custom meet
          attendee fields.
        </Typography>
      </Box>
      <TextField
        label="Custom field 1 name"
        value={customField1Name}
        onChange={(event) => setCustomField1Name(event.target.value)}
        fullWidth
        disabled={!isAdmin}
        helperText="Used to label Custom field 1 on meets in this organisation."
      />
      <TextField
        label="Custom field 2 name"
        value={customField2Name}
        onChange={(event) => setCustomField2Name(event.target.value)}
        fullWidth
        disabled={!isAdmin}
        helperText="Used to label Custom field 2 on meets in this organisation."
      />
      {saveError ? <Alert severity="error">{saveError}</Alert> : null}
      <Box sx={{ flexGrow: 1 }} />
      <Button
        variant="contained"
        onClick={() => void handleSave()}
        disabled={!organization || isSaving || !isAdmin}
        sx={{ alignSelf: "center", minWidth: 180 }}
        startIcon={saved ? <CheckCircleIcon fontSize="small" /> : undefined}
      >
        {saved ? "Saved" : "Save field names"}
      </Button>
    </Stack>
  );
}
