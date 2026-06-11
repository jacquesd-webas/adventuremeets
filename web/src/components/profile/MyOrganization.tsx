import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  MenuItem,
} from "@mui/material";
import { useEffect, useState, type ChangeEvent } from "react";
import { useFetchOrganization } from "../../hooks/useFetchOrganization";
import { useUpdateOrganization } from "../../hooks/useUpdateOrganization";
import { useCurrentOrganization } from "../../context/organizationContext";
import { ORGANIZATION_THEMES } from "../../constants/themes";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useUploadOrganizationLogo } from "../../hooks/useUploadOrganizationLogo";
import { useNotistack } from "../../hooks/useNotistack";

const actionButtonSx = { alignSelf: "center", minWidth: 180 };

type MyOrganizationProps = {
  title?: string;
  description?: string;
};

export function MyOrganization({
  title = "Organisation",
  description = "Rename your organisation and adjust its theme.",
}: MyOrganizationProps) {
  const { currentOrganizationId, currentOrganizationRole } =
    useCurrentOrganization();
  const { success } = useNotistack();
  const {
    data: organization,
    isLoading: orgLoading,
    error: orgError,
  } = useFetchOrganization(currentOrganizationId ?? undefined);
  const {
    updateOrganizationAsync,
    isLoading: orgSaving,
    error: orgSaveError,
  } = useUpdateOrganization(currentOrganizationId ?? undefined);
  const {
    uploadOrganizationLogoAsync,
    isLoading: isLogoSaving,
    error: logoSaveError,
  } = useUploadOrganizationLogo(currentOrganizationId ?? undefined);
  const [orgName, setOrgName] = useState("");
  const [orgTheme, setOrgTheme] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const [orgSaved, setOrgSaved] = useState(false);
  const [themeSaved, setThemeSaved] = useState(false);
  const [logoSaved, setLogoSaved] = useState(false);

  useEffect(() => {
    if (!organization) return;
    setOrgName(organization.name);
    setOrgTheme(organization.theme ?? "");
  }, [organization]);

  const isAdmin = currentOrganizationRole === "admin";

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
    setLogoFileName(file.name);
    void uploadOrganizationLogoAsync({ file })
      .then(() => {
        success("Organisation logo updated");
        setLogoSaved(true);
        setLogoPreview(null);
        window.setTimeout(() => setLogoSaved(false), 1500);
      })
      .catch(() => undefined);
  };

  const handleSaveOrg = async () => {
    if (!organization) return;
    await updateOrganizationAsync({
      id: organization.id,
      name: orgName,
      theme: orgTheme || undefined,
      isPrivate: organization.isPrivate,
      canViewAllMeets: organization.canViewAllMeets ?? true,
    });
    setOrgSaved(true);
    window.setTimeout(() => setOrgSaved(false), 1500);
  };

  const handleSaveTheme = async () => {
    if (!organization) return;
    await updateOrganizationAsync({
      id: organization.id,
      name: orgName,
      theme: orgTheme || undefined,
      isPrivate: organization.isPrivate,
      canViewAllMeets: organization.canViewAllMeets ?? true,
    });
    setThemeSaved(true);
    window.setTimeout(() => setThemeSaved(false), 1500);
  };

  const currentLogoSrc = logoPreview || organization?.logoUrl || undefined;

  return (
    <Stack
      spacing={2}
      sx={{ minHeight: 320, display: "flex" }}
      alignItems="flex-start"
    >
      <Box>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>
      <TextField
        label="Organisation name"
        value={orgName}
        onChange={(e) => setOrgName(e.target.value)}
        fullWidth
        disabled={orgLoading || !isAdmin}
      />
      <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
        <TextField
          select
          size="small"
          label="Background"
          value={orgTheme}
          onChange={(e) => setOrgTheme(e.target.value)}
          fullWidth
          disabled={orgLoading || !isAdmin}
          helperText="Choose an organisation background."
        >
          <MenuItem value="">Default</MenuItem>
          {ORGANIZATION_THEMES.map((theme) => (
            <MenuItem key={theme.name} value={theme.name}>
              {theme.name}
            </MenuItem>
          ))}
        </TextField>
        <Button
          variant="contained"
          color="primary"
          onClick={() => void handleSaveTheme()}
          disabled={orgLoading || orgSaving || !organization || !isAdmin}
          sx={{ minWidth: 120, alignSelf: "flex-start" }}
          startIcon={
            themeSaved ? <CheckCircleIcon fontSize="small" /> : undefined
          }
        >
          {themeSaved ? "Saved" : "Apply"}
        </Button>
      </Stack>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            width: 88,
            height: 88,
            borderRadius: 2,
            border: "1px dashed",
            borderColor: "divider",
            bgcolor: "background.paper",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {currentLogoSrc ? (
            <Box
              component="img"
              src={currentLogoSrc}
              alt="Organisation logo preview"
              sx={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : (
            <Typography variant="caption" color="text.secondary" align="center">
              No logo
            </Typography>
          )}
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Upload a logo for your organisation.
          </Typography>
          <Button
            variant="outlined"
            component="label"
            disabled={orgLoading || isLogoSaving || !isAdmin}
            sx={{ mt: 1 }}
          >
            Choose file
            <input
              hidden
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              data-testid="organization-logo-input"
            />
          </Button>
          {logoSaved ? (
            <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
              Logo saved
            </Typography>
          ) : null}
          {logoFileName ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Selected: {logoFileName}
            </Typography>
          ) : null}
        </Box>
      </Stack>
      {orgError ? <Alert severity="error">{orgError}</Alert> : null}
      {orgSaveError ? <Alert severity="error">{orgSaveError}</Alert> : null}
      {logoSaveError ? <Alert severity="error">{logoSaveError}</Alert> : null}
      <Box sx={{ flexGrow: 1 }} />
      <Button
        variant="contained"
        onClick={() => void handleSaveOrg()}
        disabled={orgLoading || orgSaving || !organization || !isAdmin}
        sx={actionButtonSx}
        startIcon={orgSaved ? <CheckCircleIcon fontSize="small" /> : undefined}
      >
        {orgSaved ? "Saved" : "Save organisation"}
      </Button>
    </Stack>
  );
}
