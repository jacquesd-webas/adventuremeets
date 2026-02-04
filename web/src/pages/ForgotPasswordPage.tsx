import {
  Alert,
  Box,
  Button,
  Container,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import { useMemo, useState } from "react";
import { useApi } from "../hooks/useApi";
import { getLogoSrc } from "../helpers/logo";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();
  const logoSrc = getLogoSrc();

  const emailIsValid = useMemo(() => isValidEmail(email), [email]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!emailIsValid || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      await api.post("/auth/password/forgot", { email: email.trim() });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Request failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        py: 8,
      }}
    >
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <img src={logoSrc} alt="AdventureMeets logo" width={320} height="auto" />
      </Box>

      <Paper elevation={2} sx={{ width: "100%", p: 3 }}>
        <Typography variant="h5" mb={2}>
          Reset your password
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
          Enter the email address associated with your account and we will send a
          reset link.
        </Typography>

        {submitted && (
          <Alert severity="success" sx={{ mb: 2 }}>
            If an account exists for that email, we sent a password reset link.
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={Boolean(email) && !emailIsValid}
              helperText={
                email && !emailIsValid
                  ? "Enter a valid email address."
                  : " "
              }
              InputProps={{
                startAdornment: (
                  <EmailOutlinedIcon
                    fontSize="small"
                    sx={{ mr: 1, color: "text.disabled" }}
                  />
                ),
              }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={!emailIsValid || isLoading}
              sx={{ textTransform: "uppercase" }}
            >
              {isLoading ? "Sending..." : "Send reset link"}
            </Button>
          </Stack>
        </Box>

        <Stack direction="row" justifyContent="space-between">
          <Link href="/login">Back to login</Link>
          <Link href="/register">Create account</Link>
        </Stack>
      </Paper>
    </Container>
  );
}

export default ForgotPasswordPage;
