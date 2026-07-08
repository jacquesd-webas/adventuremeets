import { Alert, Box, Paper, Stack, Typography } from "@mui/material";
import { useCurrentOrganization } from "../../context/organizationContext";
import { useFetchOrganization } from "../../hooks/useFetchOrganization";

function formatBytes(bytes?: number) {
  const value = Number(bytes ?? 0);
  if (value <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1,
  );
  const amount = value / 1024 ** exponent;
  const rounded =
    amount >= 10 || exponent === 0 ? amount.toFixed(0) : amount.toFixed(1);
  return `${rounded.replace(/\.0$/, "")} ${units[exponent]}`;
}

function MeetsStatCard({
  label,
  meets,
}: {
  label: string;
  meets: number;
  attendees: number;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        flex: "1 1 180px",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 0.75,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Stack spacing={0.5} sx={{ width: "100%" }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {meets}
        </Typography>
      </Stack>
    </Paper>
  );
}

function ValueStatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        flex: "1 1 180px",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 0.75,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        {value}
      </Typography>
    </Paper>
  );
}

export function OrganizationStats() {
  const { currentOrganizationId } = useCurrentOrganization();
  const { data: organization, error } = useFetchOrganization(
    currentOrganizationId ?? undefined,
  );

  return (
    <Stack
      spacing={2}
      sx={{ minHeight: 320, display: "flex" }}
      alignItems="flex-start"
    >
      <Box>
        <Typography variant="h6">Stats</Typography>
        <Typography variant="body2" color="text.secondary">
          Review organisation activity and storage usage.
        </Typography>
      </Box>

      <Stack spacing={1} sx={{ width: "100%" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Meets
        </Typography>
        <Stack
          direction="row"
          spacing={1.5}
          useFlexGap
          flexWrap="wrap"
          sx={{ width: "100%" }}
        >
          <MeetsStatCard
            label="30 days"
            meets={organization?.meetCountLast30Days ?? 0}
            attendees={organization?.attendanceCountLast30Days ?? 0}
          />
          <MeetsStatCard
            label="90 days"
            meets={organization?.meetCountLast90Days ?? 0}
            attendees={organization?.attendanceCountLast90Days ?? 0}
          />
          <MeetsStatCard
            label="Total"
            meets={organization?.meetCountTotal ?? 0}
            attendees={organization?.attendanceCountTotal ?? 0}
          />
        </Stack>
      </Stack>

      <Stack spacing={1} sx={{ width: "100%" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Users
        </Typography>
        <Stack
          direction="row"
          spacing={1.5}
          useFlexGap
          flexWrap="wrap"
          sx={{ width: "100%" }}
        >
          <ValueStatCard label="Admins" value={organization?.adminCount ?? 0} />
          <ValueStatCard
            label="Organisers"
            value={organization?.organizerCount ?? 0}
          />
          <ValueStatCard
            label="Members"
            value={organization?.memberCount ?? 0}
          />
        </Stack>
      </Stack>

      <Stack spacing={1} sx={{ width: "100%" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Resources
        </Typography>
        <Stack
          direction="row"
          spacing={1.5}
          useFlexGap
          flexWrap="wrap"
          sx={{ width: "100%" }}
        >
          <ValueStatCard
            label="Meet images"
            value={formatBytes(organization?.meetImageBytes)}
          />
          <ValueStatCard
            label="Wall images"
            value={formatBytes(organization?.wallImageBytes)}
          />
        </Stack>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}
    </Stack>
  );
}
