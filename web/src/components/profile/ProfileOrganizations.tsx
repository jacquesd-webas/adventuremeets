import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import ConfirmActionDialog from "../ConfirmActionDialog";
import { useAuth } from "../../context/authContext";
import { useCurrentOrganization } from "../../context/organizationContext";
import { useCreateOrganization } from "../../hooks/useCreateOrganization";
import { useFetchOrganisations } from "../../hooks/useFetchOrganisations";
import { useLeaveOrganization } from "../../hooks/useLeaveOrganization";
import { useNotistack } from "../../hooks/useNotistack";

type ProfileOrganizationsProps = {
  onOpenOrganization?: () => void;
};

export function ProfileOrganizations({
  onOpenOrganization,
}: ProfileOrganizationsProps) {
  const { user, refreshSession } = useAuth();
  const { success } = useNotistack();
  const { currentOrganizationId, setCurrentOrganizationId } =
    useCurrentOrganization();
  const { data: organizations, isLoading, error } = useFetchOrganisations();
  const {
    createOrganizationAsync,
    isLoading: isCreating,
    error: createError,
  } = useCreateOrganization();
  const {
    leaveOrganizationAsync,
    isLoading: isLeaving,
    error: leaveError,
  } = useLeaveOrganization();
  const [created, setCreated] = useState(false);
  const [leavingOrganization, setLeavingOrganization] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const memberships = useMemo(() => {
    const roles = user?.organizations ?? {};
    return organizations
      .filter((organization) => organization.id in roles)
      .map((organization) => ({
        ...organization,
        role: roles[organization.id],
      }));
  }, [organizations, user?.organizations]);

  const defaultOrganizationName = useMemo(() => {
    const displayName =
      [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
      user?.email?.split("@")[0] ||
      "Member";
    return `New Organisation for ${displayName}`;
  }, [user?.email, user?.firstName, user?.lastName]);

  const handleCreate = async () => {
    const organization = await createOrganizationAsync({
      name: defaultOrganizationName,
    });
    await refreshSession();
    setCurrentOrganizationId(organization.id);
    onOpenOrganization?.();
    setCreated(true);
    success("Organisation created");
    window.setTimeout(() => setCreated(false), 1500);
  };

  const handleSwitchOrganization = (organizationId: string) => {
    setCurrentOrganizationId(organizationId);
  };

  const handleEditOrganization = (organizationId: string) => {
    setCurrentOrganizationId(organizationId);
    onOpenOrganization?.();
  };

  const handleConfirmLeave = async () => {
    if (!leavingOrganization) return;

    await leaveOrganizationAsync({ id: leavingOrganization.id });
    await refreshSession();
    setLeavingOrganization(null);
    success("Left organisation");
  };

  return (
    <Stack
      spacing={2}
      sx={{ minHeight: 320, display: "flex" }}
      alignItems="flex-start"
    >
      <Box>
        <Typography variant="h6">Organisations</Typography>
        <Typography variant="body2" color="text.secondary">
          View the organisations you belong to and create a new private
          organisation.
        </Typography>
      </Box>

      <Stack spacing={1.25} sx={{ width: "100%" }}>
        {memberships.map((organization) => (
          <Paper
            key={organization.id}
            variant="outlined"
            onClick={() => handleSwitchOrganization(organization.id)}
            role="button"
            tabIndex={0}
            sx={{
              p: 1.5,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <Box>
              <Typography fontWeight={600}>{organization.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                Role: {organization.role}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton
                size="small"
                aria-label={`Edit organisation ${organization.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  handleEditOrganization(organization.id);
                }}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
              {organization.id === currentOrganizationId ? (
                <Chip label="Current" color="primary" size="small" />
              ) : (
                <Button
                  size="small"
                  color="inherit"
                  onClick={(event) => {
                    event.stopPropagation();
                    setLeavingOrganization({
                      id: organization.id,
                      name: organization.name,
                    });
                  }}
                >
                  Leave
                </Button>
              )}
            </Stack>
          </Paper>
        ))}
        {!isLoading && memberships.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            You do not belong to any organisations yet.
          </Typography>
        ) : null}
      </Stack>

      <Alert severity="info" sx={{ width: "100%" }}>
        When you create a new organisation, you will be switched to it
        automatically.
      </Alert>

      <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <Button
          variant="contained"
          onClick={() => void handleCreate()}
          disabled={isCreating}
          sx={{ minWidth: 160 }}
          startIcon={created ? <CheckCircleIcon fontSize="small" /> : undefined}
        >
          {created ? "Created" : "Create New Organisation"}
        </Button>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {createError ? <Alert severity="error">{createError}</Alert> : null}
      {leaveError ? <Alert severity="error">{leaveError}</Alert> : null}

      <ConfirmActionDialog
        open={Boolean(leavingOrganization)}
        title="Leave organisation?"
        description={
          leavingOrganization
            ? `Are you sure you want to leave ${leavingOrganization.name}?`
            : undefined
        }
        confirmLabel="Leave"
        onConfirm={() => void handleConfirmLeave()}
        onClose={() => setLeavingOrganization(null)}
        isSubmitting={isLeaving}
      />
    </Stack>
  );
}
