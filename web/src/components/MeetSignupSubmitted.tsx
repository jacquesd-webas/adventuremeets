import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useNavigate } from "react-router-dom";

type MeetSignupSubmittedProps = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneCountry?: string;
  phoneLocal?: string;
  organizationId?: string;
  meetId?: string;
  attendeeId?: string;
};

export function MeetSignupSubmitted({
  firstName,
  lastName,
  email,
  phoneCountry,
  phoneLocal,
  organizationId,
  meetId,
  attendeeId,
}: MeetSignupSubmittedProps) {
  const navigate = useNavigate();
  const handleCreateProfile = () => {
    navigate("/register", {
      state: {
        firstName,
        lastName,
        email,
        phoneCountry,
        phoneLocal,
        organizationId,
        meetId,
        attendeeId,
      },
    });
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2} alignItems="center" textAlign="center">
          <Box
            sx={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              bgcolor: "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircleIcon sx={{ color: "#ffffff", fontSize: 64 }} />
          </Box>
          <Typography variant="h5" fontWeight={700}>
            Application submitted
          </Typography>
          <Typography color="text.secondary">
            Your application has been submitted. You will be notified by the
            organizer when meet attendance has been finalized.
          </Typography>
          <Typography color="text.secondary">
            If you wish you can create a profile to make future meet signups
            faster.
          </Typography>
          <Button variant="contained" onClick={handleCreateProfile}>
            Create Profile
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
