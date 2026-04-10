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

function PrivacyPage() {
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
              Privacy Policy
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
            We respect your privacy. This policy explains what information
            AdventureMeets collects, how we use it, and when it may be shared.
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            What We Collect
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            We collect the information you choose to provide, such as:
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 3, color: "text.secondary" }}>
            <li>
              Account information (for example your name, email address, and
              password or social sign-in identifiers).
            </li>
            <li>
              Profile and safety information you add (for example phone number
              and emergency contact details).
            </li>
            <li>
              Meet participation information (for example the details you submit
              on a meet signup sheet, check-in status, and messages related to a
              meet).
            </li>
            <li>
              Basic technical data (for example device/browser details and
              logs), which helps us keep the service secure and reliable.
            </li>
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 800, mt: 3, mb: 1 }}>
            How We Use Your Information
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 3, color: "text.secondary" }}>
            <li>To provide and operate AdventureMeets.</li>
            <li>To create and manage meets, attendees, and check-ins.</li>
            <li>To authenticate you and keep your account secure.</li>
            <li>
              To communicate with you about your account, invites, and meet
              activity.
            </li>
            <li>To prevent abuse, fraud, and security incidents.</li>
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 800, mt: 3, mb: 1 }}>
            How We Share Information
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            We do not sell your personal information and we do not share it with
            third parties for their marketing or advertising.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            We share relevant information only in the following cases:
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 3, color: "text.secondary" }}>
            <li>
              <strong>Meet organisers:</strong> If you sign up for a meet, the
              organiser will be able to see the information needed to manage
              that meet (for example attendee details and check-in status).
            </li>
            <li>
              <strong>Service providers:</strong> We use service providers to
              run the platform (for example hosting and email delivery). They
              may process personal information on our behalf to provide those
              services.
            </li>
            <li>
              <strong>Legal and safety:</strong> If required by law or to
              protect users, the public, or our service.
            </li>
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 800, mt: 3, mb: 1 }}>
            Cookies
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            We use cookies or local storage where necessary for sign-in and to
            keep you logged in. We may also use minimal technical cookies needed
            for security and performance.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 800, mt: 3, mb: 1 }}>
            Data Retention
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            We keep information for as long as needed to provide the service and
            for legitimate business purposes (for example account management,
            security, and record-keeping). You can request deletion of your
            account, subject to any legal requirements.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 800, mt: 3, mb: 1 }}>
            Security
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            We take reasonable measures to protect your information, but no
            system is 100% secure.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 800, mt: 3, mb: 1 }}>
            Contact Us
          </Typography>
          <Typography variant="body2" color="text.secondary">
            If you have questions about this policy, contact us via the support
            channel listed in the app.
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

export default PrivacyPage;
