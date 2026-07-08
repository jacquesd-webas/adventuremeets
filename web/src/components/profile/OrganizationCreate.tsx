import { Alert, Button, Stack, Typography } from "@mui/material";

type OrganizationCreateProps = {
  onGoToProfile?: () => void;
};

export function OrganizationCreate({ onGoToProfile }: OrganizationCreateProps) {
  return (
    <Stack spacing={2} alignItems="flex-start">
      <Stack spacing={0.5}>
        <Typography variant="h6">Create</Typography>
        <Typography variant="body2" color="text.secondary">
          Create a new organisation from your profile, then return here to
          manage its theme, privacy, invites, and fields.
        </Typography>
      </Stack>
      <Alert severity="info" sx={{ width: "100%" }}>
        Organisations can be created under your user profile.
      </Alert>
      <Button variant="contained" onClick={onGoToProfile}>
        Go to Profile
      </Button>
    </Stack>
  );
}
