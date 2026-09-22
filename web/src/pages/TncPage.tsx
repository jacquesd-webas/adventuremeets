import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

function TncPage() {
  const lastUpdated = "April 10, 2026";
  const nav = useNavigate();

  const handleClose = () => {
    // If the user landed directly here, `-1` may be unhelpful; fallback to home.
    if (typeof window !== "undefined" && window.history.length <= 1) {
      nav("/", { replace: true });
      return;
    }
    nav(-1);
  };

  return (
    <Box sx={{ minHeight: "100vh", py: { xs: 3, sm: 6 } }}>
      <Container maxWidth="md">
        <Paper elevation={2} sx={{ p: { xs: 2.5, sm: 4 } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 2,
              mb: 1,
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Terms and Conditions
            </Typography>
            <IconButton
              aria-label="Close"
              onClick={handleClose}
              sx={{ mt: 0.5 }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Last updated: {lastUpdated}
          </Typography>

          <Typography variant="body1" sx={{ mb: 2 }}>
            These Terms and Conditions govern your access to and use of
            AdventureMeets. By using the service, you agree to these terms.
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            Service Is Free and Provided “As Is”
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            AdventureMeets is provided for free. The service is provided “as is”
            and “as available” without warranties of any kind, whether express,
            implied, or statutory.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 800, mt: 3, mb: 1 }}>
            No Warranty
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            We do not guarantee that the service will be uninterrupted, timely,
            secure, or error-free, or that any meets, communications, or
            information will be accurate or reliable.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 800, mt: 3, mb: 1 }}>
            Meets Are Organised by Users
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Meets are created and managed by organisers and attended by users.
            You are responsible for your own decisions and actions when joining
            or organising a meet.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 800, mt: 3, mb: 1 }}>
            Limitation of Liability
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            To the maximum extent permitted by law, AdventureMeets (and its
            owners, operators, and contributors) will not be liable for any
            direct, indirect, incidental, special, consequential, or punitive
            damages, or any loss or injury arising out of or related to:
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 3, color: "text.secondary" }}>
            <li>Your use of (or inability to use) the service.</li>
            <li>
              Any meet, event, activity, or interaction organised through the
              service.
            </li>
            <li>
              Any action or omission of organisers, attendees, or other users.
            </li>
            <li>Any reliance on information provided through the service.</li>
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 800, mt: 3, mb: 1 }}>
            Acceptable Use
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You agree not to misuse the service, including attempting to access
            accounts or data you do not have permission to access, or using the
            platform for unlawful or harmful activities.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 800, mt: 3, mb: 1 }}>
            Changes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            We may update these terms from time to time. Continued use of the
            service after changes become effective means you accept the updated
            terms.
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Button
            variant="outlined"
            onClick={handleClose}
            sx={{
              width: { xs: "100%", sm: "fit-content" },
              alignSelf: "flex-start",
            }}
          >
            Close
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}

export default TncPage;
