import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/authContext";
import { useCurrentOrganization } from "../../context/organizationContext";
import { useAcceptOrganizationInvite } from "../../hooks/useAcceptOrganizationInvite";
import { useDeclineOrganizationInvite } from "../../hooks/useDeclineOrganizationInvite";

type PendingInvitePrompt = {
  id: string;
  organizationId: string;
  organizationName: string;
};

type PendingInvitePromptModalProps = {
  pendingInvites: PendingInvitePrompt[];
};

export function PendingInvitePromptModal({
  pendingInvites,
}: PendingInvitePromptModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(820));
  const { refreshSession } = useAuth();
  const { currentOrganizationId, setCurrentOrganizationId } =
    useCurrentOrganization();
  const {
    acceptInviteAsync,
    isLoading: isAcceptingInvite,
    error: acceptError,
  } = useAcceptOrganizationInvite();
  const {
    declineInviteAsync,
    isLoading: isDecliningInvite,
    error: declineError,
  } = useDeclineOrganizationInvite();
  const [handledInviteIds, setHandledInviteIds] = useState<string[]>([]);
  const isLoading = isAcceptingInvite || isDecliningInvite;
  const error = acceptError || declineError;

  const pendingInvitesKey = useMemo(
    () => pendingInvites.map((invite) => invite.id).join("|"),
    [pendingInvites],
  );
  const activePendingInvite = useMemo(
    () =>
      pendingInvites.find((invite) => !handledInviteIds.includes(invite.id)) ??
      null,
    [pendingInvites, handledInviteIds],
  );

  useEffect(() => {
    setHandledInviteIds([]);
  }, [pendingInvitesKey]);

  const handleDecline = async () => {
    if (!activePendingInvite) return;
    await declineInviteAsync({ inviteId: activePendingInvite.id });
    await refreshSession();
    setHandledInviteIds((prev) => [...prev, activePendingInvite.id]);
  };

  const handleAccept = async () => {
    if (!activePendingInvite) return;
    await acceptInviteAsync({ inviteId: activePendingInvite.id });
    await refreshSession();
    if (!currentOrganizationId) {
      setCurrentOrganizationId(activePendingInvite.organizationId);
    }
    setHandledInviteIds((prev) => [...prev, activePendingInvite.id]);
  };

  const modalContent = (
    <Stack spacing={2} sx={{ mt: 1 }}>
      <Typography variant="body1">
        You have been invited to join{" "}
        <Box component="strong">
          {activePendingInvite?.organizationName || ""}
        </Box>
        . Do you want to accept the invite?
      </Typography>
      {error ? <Alert severity="error">{error}</Alert> : null}
    </Stack>
  );

  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={Boolean(activePendingInvite)}
        onClose={isLoading ? () => undefined : () => void handleDecline()}
        ModalProps={{ disableEscapeKeyDown: isLoading }}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            px: 2,
            py: 2,
          },
        }}
      >
        <Box sx={{ width: "100%" }}>
          <Typography variant="h6">Pending invite</Typography>
          {modalContent}
          <Stack
            direction="row"
            justifyContent="flex-end"
            spacing={1}
            sx={{ mt: 2 }}
          >
            <Button
              variant="outlined"
              onClick={() => void handleDecline()}
              disabled={isLoading}
            >
              No
            </Button>
            <Button
              variant="contained"
              onClick={() => void handleAccept()}
              disabled={isLoading}
            >
              Yes
            </Button>
          </Stack>
        </Box>
      </Drawer>
    );
  }

  return (
    <Dialog
      open={Boolean(activePendingInvite)}
      onClose={isLoading ? () => undefined : () => void handleDecline()}
      fullWidth
      maxWidth="sm"
      disableEscapeKeyDown={isLoading}
    >
      <DialogTitle>Pending invite</DialogTitle>
      <DialogContent>{modalContent}</DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          onClick={() => void handleDecline()}
          disabled={isLoading}
        >
          No
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleAccept()}
          disabled={isLoading}
        >
          Yes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
