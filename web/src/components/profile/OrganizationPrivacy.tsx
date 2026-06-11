import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useCurrentOrganization } from "../../context/organizationContext";
import { useFetchOrganization } from "../../hooks/useFetchOrganization";
import { useUpdateOrganization } from "../../hooks/useUpdateOrganization";
import { OrganizationInviteLinkField } from "./OrganizationInviteLinkField";

export function OrganizationPrivacy() {
  const { currentOrganizationId, currentOrganizationRole } =
    useCurrentOrganization();
  const { data: organization } = useFetchOrganization(
    currentOrganizationId ?? undefined,
  );
  const {
    updateOrganizationAsync,
    isLoading: orgSaving,
    error: orgSaveError,
  } = useUpdateOrganization(currentOrganizationId ?? undefined);
  const [isOrgPrivate, setIsOrgPrivate] = useState(true);
  const [canViewAllMeets, setCanViewAllMeets] = useState(true);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const isAdmin = currentOrganizationRole === "admin";
  const inviteLink = currentOrganizationId
    ? `${window.location.origin}/register?org=${currentOrganizationId}`
    : "";

  useEffect(() => {
    if (!organization) return;
    setIsOrgPrivate(Boolean(organization.isPrivate));
    setCanViewAllMeets(organization.canViewAllMeets ?? true);
  }, [organization]);

  const copyInvite = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
  };

  const handleSavePrivacySettings = async () => {
    if (!organization) return;
    await updateOrganizationAsync({
      id: organization.id,
      name: organization.name,
      theme: organization.theme || undefined,
      isPrivate: isOrgPrivate,
      canViewAllMeets,
    });
    setSettingsSaved(true);
    window.setTimeout(() => setSettingsSaved(false), 1500);
  };

  return (
    <Stack
      spacing={2}
      sx={{ minHeight: 320, display: "flex" }}
      alignItems="flex-start"
    >
      <Box>
        <Typography variant="h6">Privacy</Typography>
        <Typography variant="body2" color="text.secondary">
          Manage how members join and what they can see.
        </Typography>
      </Box>
      <Stack spacing={1.5} sx={{ width: "100%" }}>
        <FormControlLabel
          control={
            <Switch
              checked={!isOrgPrivate}
              onChange={(event) => setIsOrgPrivate(!event.target.checked)}
              disabled={orgSaving || !isAdmin}
            />
          }
          label="Allow regular users to join with invite link"
        />
        {!isOrgPrivate ? (
          <OrganizationInviteLinkField
            value={inviteLink}
            copied={false}
            onCopy={() => void copyInvite()}
            helperText="Use this link to directly invite normal members to your organisation."
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
              disabled={orgSaving || !isAdmin}
            />
          }
          label="Allow members to see all events in this organisation"
        />
        <Button
          variant="contained"
          onClick={() => void handleSavePrivacySettings()}
          disabled={orgSaving || !organization || !isAdmin}
          sx={{ alignSelf: "flex-start", minWidth: 220 }}
          startIcon={
            settingsSaved ? <CheckCircleIcon fontSize="small" /> : undefined
          }
        >
          {settingsSaved ? "Saved" : "Save privacy settings"}
        </Button>
      </Stack>
      {orgSaveError ? <Alert severity="error">{orgSaveError}</Alert> : null}
    </Stack>
  );
}
