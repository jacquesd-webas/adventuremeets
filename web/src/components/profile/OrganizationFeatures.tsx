import { Box, Stack, Typography } from "@mui/material";

export function OrganizationFeatures() {
  return (
    <Stack
      spacing={2}
      sx={{ minHeight: 320, display: "flex" }}
      alignItems="flex-start"
    >
      <Box>
        <Typography variant="h6">Features</Typography>
        <Typography variant="body2" color="text.secondary">
          AdventureMeets is intended as a free community app, however some
          features will need to be paid in order to cover associated costs.
          Below are some examples or what is being considered as paid add-on.
        </Typography>
      </Box>

      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Advanced reporting
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Richer reports and analytics for businesses that do not really apply
          to the social community use.
        </Typography>
      </Box>

      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Branded communications
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Add your own business branding to e-mail communications and
          potentially your own subdomain for handling meet communications.
        </Typography>
      </Box>

      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          WhatsApp integration
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Add your WhatsApp business account to AdventureMeets to allow sending
          messages to your groups or subscribers.
        </Typography>
      </Box>

      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Payment Gateway
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Have attendees make payments directly in AdventureMeets when meets you
          are hosting are not free.
        </Typography>
      </Box>

      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Storage options
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Cloud storage costs money so we intend to make a certain amount of
          space available for free for photo uploads, but there will be a point
          where we will need to delete photos or charge for more storage.
        </Typography>
      </Box>
    </Stack>
  );
}
