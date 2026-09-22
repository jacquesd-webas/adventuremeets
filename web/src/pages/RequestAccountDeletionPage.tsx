import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Link,
  Paper,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

function RequestAccountDeletionPage() {
  const lastUpdated = "April 22, 2026";
  const nav = useNavigate();

  const handleClose = () => {
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
              Request Account Deletion
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
            If you would like AdventureMeets to delete your account and
            associated personal data, please send a deletion request to{" "}
            <Link href="mailto:support@fringecoding.com">
              support@fringecoding.com
            </Link>
            .
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            What To Include
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 3, color: "text.secondary" }}>
            <li>The email address used on your AdventureMeets account.</li>
            <li>
              If you signed in with Facebook, mention that your request relates
              to your Facebook-connected account.
            </li>
            <li>
              Any additional details needed to identify your account if you no
              longer have access to the original email address.
            </li>
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 800, mt: 3, mb: 1 }}>
            What Happens Next
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 3, color: "text.secondary" }}>
            <li>We will review the request and verify the account owner.</li>
            <li>
              Once verified, we will delete or anonymise the account data we no
              longer need to keep.
            </li>
            <li>
              Some records may be retained where required for legal, security,
              fraud-prevention, or audit purposes.
            </li>
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 800, mt: 3, mb: 1 }}>
            Related Information
          </Typography>
          <Typography variant="body2" color="text.secondary">
            For more detail about how AdventureMeets collects, uses, and retains
            data, see our{" "}
            <Link href="/privacy" underline="hover">
              Privacy Policy
            </Link>
            .
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

export default RequestAccountDeletionPage;
