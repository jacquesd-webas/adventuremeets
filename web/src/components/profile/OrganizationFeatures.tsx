import { Box, Stack, Switch, Typography } from "@mui/material";
import { useMemo } from "react";
import { useCurrentOrganization } from "../../context/organizationContext";
import { useFetchOrganization } from "../../hooks/useFetchOrganization";

export function OrganizationFeatures() {
  const { currentOrganizationId } = useCurrentOrganization();
  const { data: organization } = useFetchOrganization(
    currentOrganizationId ?? undefined,
  );
  const featureRows = useMemo(
    () =>
      [
        {
          label: "Advanced reporting",
          description:
            "Richer reports and analytics for businesses that do not really apply to the social community use.",
          checked: Boolean(organization?.reportingEnabled),
        },
        {
          label: "Branded communications",
          description:
            "Add your own business branding to e-mail communications.",
          checked: Boolean(organization?.brandingEnabled),
        },
        {
          label: "Custom domains",
          description:
            "Allow your own subdomain or domain for handling meet communications.",
          checked: Boolean(organization?.domainEnabled),
        },
        {
          label: "WhatsApp integration",
          description:
            "Add your WhatsApp business account to AdventureMeets to allow sending messages to your groups or subscribers.",
          checked: Boolean(organization?.whatsappEnabled),
        },
        {
          label: "Payment Gateway",
          description:
            "Have attendees make payments directly in AdventureMeets when meets you are hosting are not free.",
          checked: Boolean(organization?.paymentsEnabled),
        },
        {
          label: "Storage options",
          description:
            "Cloud storage costs money so we intend to make a certain amount of space available for free for photo uploads, but there will be a point where we will need to delete photos or charge for more storage.",
          checked: Boolean(organization?.diskQuotasEnabled),
        },
        {
          label: "Webhooks",
          description:
            "Allow outbound webhook notifications so your organisation can integrate AdventureMeets events with external systems.",
          checked: Boolean(organization?.enableWebhooks),
        },
      ] as const,
    [
      organization?.brandingEnabled,
      organization?.diskQuotasEnabled,
      organization?.domainEnabled,
      organization?.enableWebhooks,
      organization?.paymentsEnabled,
      organization?.reportingEnabled,
      organization?.whatsappEnabled,
    ],
  );

  return (
    <Stack
      spacing={2}
      sx={{ minHeight: 320, display: "flex" }}
      alignItems="flex-start"
    >
      <Box>
        <Typography variant="h6">Features</Typography>
        <Typography variant="body2" color="text.secondary">
          These organisation feature flags are shown here for reference.
        </Typography>
      </Box>

      <Stack spacing={1.5} sx={{ width: "100%" }}>
        {featureRows.map((feature) => (
          <Box
            key={feature.label}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              py: 1,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                {feature.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {feature.description}
              </Typography>
            </Box>
            <Switch
              checked={feature.checked}
              disabled
              inputProps={{ "aria-label": feature.label }}
            />
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}
