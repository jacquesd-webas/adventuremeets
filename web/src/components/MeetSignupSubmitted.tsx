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
import { useAuth } from "../context/AuthContext";

type MeetSignupSubmittedProps = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneCountry?: string;
  phoneLocal?: string;
  organizationId?: string;
  meetId?: string;
  attendeeId?: string;
  shareCode?: string;
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
  shareCode,
}: MeetSignupSubmittedProps) {
  const nav = useNavigate();
  const { isAuthenticated } = useAuth();
  const handleCreateProfile = () => {
    nav("/register", {
      state: {
        firstName,
        lastName,
        email,
        phoneCountry,
        phoneLocal,
        organizationId,
        meetId,
        shareCode,
        attendeeId,
      },
    });
  };
  const handleShowStatus = () => {
    if (!shareCode || !attendeeId) return;
    nav(`/meets/${shareCode}/${attendeeId}`);
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
          {isAuthenticated ? (
            <Button
              variant="contained"
              onClick={handleShowStatus}
              disabled={!shareCode || !attendeeId}
            >
              Show Status
            </Button>
          ) : (
            <>
              <Typography color="text.secondary">
                If you wish you can create a profile to make future meet signups
                faster and manage your applications. Alternatively just use the
                link below to check the status of your application.
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button variant="contained" onClick={handleCreateProfile}>
                  Create Profile
                </Button>
                <Button variant="outlined" onClick={handleShowStatus}>
                  Show Status
                </Button>
              </Stack>
            </>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}
