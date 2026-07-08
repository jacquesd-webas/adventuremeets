import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useFetchOrganization } from "../../hooks/useFetchOrganization";
import { useUpdateOrganization } from "../../hooks/useUpdateOrganization";
import { useCurrentOrganization } from "../../context/organizationContext";
import { ORGANIZATION_THEMES } from "../../constants/themes";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { OrganizationInviteLinkField } from "./OrganizationInviteLinkField";

const actionButtonSx = { alignSelf: "center", minWidth: 180 };

export function MyOrganization() {
  const { currentOrganizationId, currentOrganizationRole } =
    useCurrentOrganization();
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
  const [orgName, setOrgName] = useState("");
  const [orgTheme, setOrgTheme] = useState("");
  const [isOrgPrivate, setIsOrgPrivate] = useState(true);
  const [canViewAllMeets, setCanViewAllMeets] = useState(true);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [orgSaved, setOrgSaved] = useState(false);
  const [themeSaved, setThemeSaved] = useState(false);

  useEffect(() => {
    if (!organization) return;
    setOrgName(organization.name);
    setOrgTheme(organization.theme ?? "");
    setIsOrgPrivate(Boolean(organization.isPrivate));
    setCanViewAllMeets(organization.canViewAllMeets ?? true);
  }, [organization]);

  const isAdmin = currentOrganizationRole === "admin";
  const inviteLink = currentOrganizationId
    ? `${window.location.origin}/register?org=${currentOrganizationId}`
    : "";

  const handleSaveOrg = async () => {
    if (!organization) return;
    await updateOrganizationAsync({
      id: organization.id,
      name: orgName,
      theme: orgTheme || undefined,
      isPrivate: isOrgPrivate,
      canViewAllMeets,
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
      isPrivate: isOrgPrivate,
      canViewAllMeets,
    });
    setThemeSaved(true);
    window.setTimeout(() => setThemeSaved(false), 1500);
  };

  const copyInvite = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setInviteCopied(true);
    window.setTimeout(() => setInviteCopied(false), 1500);
  };

  return (
    <Stack
      spacing={2}
      sx={{ minHeight: 320, display: "flex" }}
      alignItems="flex-start"
    >
      <Box>
        <Typography variant="h6">Organisation</Typography>
        <Typography variant="body2" color="text.secondary">
          Rename your organisation and adjust its theme.
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
          label="Theme"
          value={orgTheme}
          onChange={(e) => setOrgTheme(e.target.value)}
          fullWidth
          disabled={orgLoading || !isAdmin}
          helperText="Choose an organisation theme."
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
          {themeSaved ? "Saved" : "Change"}
        </Button>
      </Stack>
      <FormControlLabel
        control={
          <Switch
            checked={!isOrgPrivate}
            onChange={(event) => setIsOrgPrivate(!event.target.checked)}
            disabled={orgLoading || !isAdmin}
          />
        }
        label="Allow regular users to join with invite link"
      />
      {!isOrgPrivate ? (
        <OrganizationInviteLinkField
          value={inviteLink}
          copied={inviteCopied}
          onCopy={() => void copyInvite()}
          helperText="Share this link to invite members to your organisation."
          type={isAdmin ? "text" : "password"}
          disabled={!isAdmin}
          preventCopyWhenDisabled
        />
      ) : null}
      <FormControlLabel
        control={
          <Switch
            checked={canViewAllMeets}
            onChange={(event) => setCanViewAllMeets(event.target.checked)}
            disabled={orgLoading || !isAdmin}
          />
        }
        label="Allow members to see all events in this organisation"
      />
      {orgError ? <Alert severity="error">{orgError}</Alert> : null}
      {orgSaveError ? <Alert severity="error">{orgSaveError}</Alert> : null}
      <Box sx={{ flexGrow: 1 }} />
      <Button
        variant="contained"
        onClick={() => void handleSaveOrg()}
        disabled={orgLoading || orgSaving || !organization || !isAdmin}
        sx={actionButtonSx}
        startIcon={orgSaved ? <CheckCircleIcon fontSize="small" /> : undefined}
      >
        {orgSaved ? "Saved" : "Save organization"}
      </Button>
    </Stack>
  );
}
