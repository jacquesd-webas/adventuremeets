import {
  Alert,
  Box,
  Button,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useCreateOrganizationInvite } from "../../hooks/useCreateOrganizationInvite";
import { useOrganizationRoleOptions } from "../../hooks/useOrganizationRoleOptions";
import { useFetchOrganizationInvites } from "../../hooks/useFetchOrganizationInvites";
import { useNotistack } from "../../hooks/useNotistack";
import { useCurrentOrganization } from "../../context/organizationContext";
import { OrganizationInviteInfo } from "./OrganizationInviteInfo";

export function OrganizationInvites() {
  const { success } = useNotistack();
  const { currentOrganizationId, currentOrganizationRole } =
    useCurrentOrganization();
  const {
    createInviteAsync,
    isLoading: isInviteSaving,
    error: inviteError,
  } = useCreateOrganizationInvite();
  const {
    data: invites,
    isLoading: invitesLoading,
    error: invitesError,
  } = useFetchOrganizationInvites(currentOrganizationId || undefined);
  const { roleOptions, defaultRoleId } = useOrganizationRoleOptions();
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [inviteEmailInput, setInviteEmailInput] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState(defaultRoleId);
  const isAdmin = currentOrganizationRole === "admin";

  const toInviteRegisterUrl = (tokenOrUrl?: string) => {
    if (!tokenOrUrl) return "";
    if (/^https?:\/\//i.test(tokenOrUrl)) {
      return tokenOrUrl;
    }
    return `${window.location.origin}/register?invite=${encodeURIComponent(
      tokenOrUrl,
    )}`;
  };

  const handleInviteUser = async () => {
    const trimmedEmail = inviteEmailInput.trim();
    if (!currentOrganizationId || !trimmedEmail) return;
    await createInviteAsync({
      organizationId: currentOrganizationId,
      email: trimmedEmail,
      roleId: inviteRoleId,
    });
    setInviteEmailInput("");
    success("Invite created");
  };

  const copyPendingInviteLink = async (invite: {
    id: string;
    token: string;
    inviteUrl?: string;
  }) => {
    const registerUrl = toInviteRegisterUrl(invite.inviteUrl || invite.token);
    if (!registerUrl) return;
    await navigator.clipboard.writeText(registerUrl);
    setCopiedInviteId(invite.id);
    window.setTimeout(() => {
      setCopiedInviteId((current) => (current === invite.id ? null : current));
    }, 1500);
  };

  return (
    <Stack
      spacing={2}
      sx={{ minHeight: 320, display: "flex" }}
      alignItems="flex-start"
    >
      <Box>
        <Typography variant="h6">Invites</Typography>
        <Typography variant="body2" color="text.secondary">
          Invite specific users to join your organisation.
        </Typography>
      </Box>
      <Stack spacing={1.5} sx={{ width: "100%" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ width: "100%" }}
        >
          <TextField
            label="Email"
            type="email"
            value={inviteEmailInput}
            size="small"
            onChange={(event) => setInviteEmailInput(event.target.value)}
            fullWidth
            disabled={!isAdmin}
          />
          <TextField
            select
            label="Role"
            value={String(inviteRoleId)}
            size="small"
            onChange={(event) => setInviteRoleId(Number(event.target.value))}
            sx={{ minWidth: 180 }}
            disabled={!isAdmin}
          >
            {roleOptions.map((option) => (
              <MenuItem key={option.id} value={String(option.id)}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            onClick={() => void handleInviteUser()}
            disabled={
              !isAdmin ||
              !currentOrganizationId ||
              !inviteEmailInput.trim() ||
              isInviteSaving
            }
            sx={{ minWidth: 140, alignSelf: "stretch" }}
          >
            {isInviteSaving ? "Sending..." : "Invite User"}
          </Button>
        </Stack>
      </Stack>
      <Divider sx={{ width: "100%" }} />
      <Stack spacing={1.5} sx={{ width: "100%" }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Invites
        </Typography>
        {invitesLoading ? (
          <Typography variant="body2" color="text.secondary">
            Loading...
          </Typography>
        ) : invitesError ? (
          <Alert severity="error">{invitesError}</Alert>
        ) : invites.length ? (
          <Stack spacing={1} sx={{ width: "100%" }}>
            <Box
              sx={{
                width: "100%",
                overflowX: "auto",
              }}
            >
              <Box
                sx={{
                  minWidth: 500,
                  display: "grid",
                  gridTemplateColumns: "32px minmax(220px, 2fr) 140px 64px",
                  columnGap: 1.5,
                  px: 1.5,
                  pb: 0.5,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Email
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textAlign: "center" }}
                >
                  Role
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textAlign: "center", justifySelf: "center" }}
                >
                  Link
                </Typography>
              </Box>
              <Stack spacing={1}>
                {invites.map((invite) => (
                  <OrganizationInviteInfo
                    key={invite.id}
                    invite={invite}
                    copied={copiedInviteId === invite.id}
                    onCopy={() => void copyPendingInviteLink(invite)}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No valid invites.
          </Typography>
        )}
      </Stack>
      {inviteError ? <Alert severity="error">{inviteError}</Alert> : null}
    </Stack>
  );
}
