import { Alert } from "@mui/material";

export function OrganizerOverrideWarning() {
  return (
    <Alert severity="warning" sx={{ mt: 2 }}>
      You are making admin-level changes to someone else's meet. Please make
      sure you have a good reason to do this and that you have communicated with
      the organiser and attendees as needed.
    </Alert>
  );
}
