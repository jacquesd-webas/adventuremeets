import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  Alert,
  Box,
  Button,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useCurrentOrganization } from "../../context/organizationContext";
import { useFetchOrganization } from "../../hooks/useFetchOrganization";
import { useFetchOrganizationTemplates } from "../../hooks/useFetchOrganizationTemplates";
import { useUpdateOrganization } from "../../hooks/useUpdateOrganization";

export function OrganizationDefaults() {
  const { currentOrganizationId, currentOrganizationRole } =
    useCurrentOrganization();
  const { data: organization } = useFetchOrganization(
    currentOrganizationId ?? undefined,
  );
  const { data: templates } = useFetchOrganizationTemplates(
    currentOrganizationId ?? undefined,
  );
  const {
    updateOrganizationAsync,
    isLoading: isSaving,
    error: saveError,
  } = useUpdateOrganization(currentOrganizationId ?? undefined);
  const [defaultTemplateId, setDefaultTemplateId] = useState("");
  const [defaultRequireIndemnity, setDefaultRequireIndemnity] = useState(false);
  const [defaultAutoApproveAttendees, setDefaultAutoApproveAttendees] =
    useState(false);
  const [defaultAllowGuests, setDefaultAllowGuests] = useState(false);
  const [defaultAllowSelfCheckin, setDefaultAllowSelfCheckin] = useState(false);
  const [defaultAllowWalkins, setDefaultAllowWalkins] = useState(false);
  const [saved, setSaved] = useState(false);
  const isAdmin = currentOrganizationRole === "admin";

  useEffect(() => {
    if (!organization) return;
    setDefaultTemplateId(organization.defaultTemplateId ?? "");
    setDefaultRequireIndemnity(Boolean(organization.defaultRequireIndemnity));
    setDefaultAutoApproveAttendees(
      Boolean(organization.defaultAutoApproveAttendees),
    );
    setDefaultAllowGuests(Boolean(organization.defaultAllowGuests));
    setDefaultAllowSelfCheckin(Boolean(organization.defaultAllowSelfCheckin));
    setDefaultAllowWalkins(Boolean(organization.defaultAllowWalkins));
  }, [organization]);

  const handleSave = async () => {
    if (!organization) return;
    await updateOrganizationAsync({
      id: organization.id,
      name: organization.name,
      theme: organization.theme || undefined,
      isPrivate: organization.isPrivate,
      canViewAllMeets: organization.canViewAllMeets ?? true,
      defaultTemplateId: defaultTemplateId || null,
      defaultRequireIndemnity,
      defaultAutoApproveAttendees,
      defaultAllowGuests,
      defaultAllowSelfCheckin,
      defaultAllowWalkins,
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
        <Typography variant="h6">Defaults</Typography>
        <Typography variant="body2" color="text.secondary">
          Choose the organization defaults that should be applied automatically
          when creating a new meet.
        </Typography>
      </Box>

      <Stack spacing={0.75} sx={{ width: "100%" }}>
        <Typography variant="subtitle2">Always apply template</Typography>
        <FormControl fullWidth size="small">
          <Select
            value={defaultTemplateId}
            onChange={(event) =>
              setDefaultTemplateId(String(event.target.value))
            }
            disabled={!isAdmin}
            displayEmpty
            inputProps={{ "aria-label": "Always apply template" }}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {templates.map((template) => (
              <MenuItem key={template.id} value={template.id}>
                {template.name || "Untitled template"}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Stack spacing={1} sx={{ width: "100%" }}>
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          justifyContent="space-between"
        >
          <Box>
            <Typography>Require indemnity</Typography>
          </Box>
          <Switch
            checked={defaultRequireIndemnity}
            disabled={!isAdmin}
            onChange={(event) =>
              setDefaultRequireIndemnity(event.target.checked)
            }
            inputProps={{ "aria-label": "Require indemnity" }}
          />
        </Stack>
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          justifyContent="space-between"
        >
          <Box>
            <Typography>Auto approve attendees</Typography>
          </Box>
          <Switch
            checked={defaultAutoApproveAttendees}
            disabled={!isAdmin}
            onChange={(event) =>
              setDefaultAutoApproveAttendees(event.target.checked)
            }
            inputProps={{ "aria-label": "Auto approve attendees" }}
          />
        </Stack>
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          justifyContent="space-between"
        >
          <Box>
            <Typography>Allow guests</Typography>
          </Box>
          <Switch
            checked={defaultAllowGuests}
            disabled={!isAdmin}
            onChange={(event) => setDefaultAllowGuests(event.target.checked)}
            inputProps={{ "aria-label": "Allow guests" }}
          />
        </Stack>
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          justifyContent="space-between"
        >
          <Box>
            <Typography>Allow self-checkin</Typography>
          </Box>
          <Switch
            checked={defaultAllowSelfCheckin}
            disabled={!isAdmin}
            onChange={(event) =>
              setDefaultAllowSelfCheckin(event.target.checked)
            }
            inputProps={{ "aria-label": "Allow self-checkin" }}
          />
        </Stack>
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          justifyContent="space-between"
        >
          <Box>
            <Typography>Allow walk-ins</Typography>
          </Box>
          <Switch
            checked={defaultAllowWalkins}
            disabled={!isAdmin}
            onChange={(event) => setDefaultAllowWalkins(event.target.checked)}
            inputProps={{ "aria-label": "Allow walk-ins" }}
          />
        </Stack>
      </Stack>

      {saveError ? <Alert severity="error">{saveError}</Alert> : null}
      <Box sx={{ flexGrow: 1 }} />
      <Button
        variant="contained"
        onClick={() => void handleSave()}
        disabled={!organization || isSaving || !isAdmin}
        sx={{ alignSelf: "center", minWidth: 180 }}
        startIcon={saved ? <CheckCircleIcon fontSize="small" /> : undefined}
      >
        {saved ? "Saved" : "Save defaults"}
      </Button>
    </Stack>
  );
}
