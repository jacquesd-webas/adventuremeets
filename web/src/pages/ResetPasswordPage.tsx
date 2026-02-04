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
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useMemo, useState } from "react";
import { useApi } from "../hooks/useApi";
import { useLocation } from "react-router-dom";
import { getLogoSrc } from "../helpers/logo";

const MIN_PASSWORD_LENGTH = 8;

function ResetPasswordPage() {
  const api = useApi();
  const location = useLocation();
  const logoSrc = getLogoSrc();
  const params = new URLSearchParams(location.search);
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordValid = useMemo(
    () => password.length >= MIN_PASSWORD_LENGTH,
    [password]
  );
  const passwordsMatch = useMemo(
    () => Boolean(password) && password === confirmPassword,
    [password, confirmPassword]
  );
  const canSubmit =
    Boolean(token) && passwordValid && passwordsMatch && !isLoading;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setIsLoading(true);
    setError(null);
    try {
      await api.post("/auth/password/reset", { token, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Password reset failed");
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
          Choose a new password
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
          Your new password must be at least {MIN_PASSWORD_LENGTH} characters.
        </Typography>

        {!token && (
          <Alert severity="error" sx={{ mb: 2 }}>
            This reset link is missing a token. Please request a new link.
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Your password was updated successfully. You can now sign in.
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
              label="New password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={Boolean(password) && !passwordValid}
              helperText={
                password && !passwordValid
                  ? `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
                  : " "
              }
              InputProps={{
                startAdornment: (
                  <LockOutlinedIcon
                    fontSize="small"
                    sx={{ mr: 1, color: "text.disabled" }}
                  />
                ),
              }}
            />
            <TextField
              label="Confirm password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={Boolean(confirmPassword) && !passwordsMatch}
              helperText={
                confirmPassword && !passwordsMatch
                  ? "Passwords do not match."
                  : " "
              }
              InputProps={{
                startAdornment: (
                  <LockOutlinedIcon
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
              disabled={!canSubmit || success}
              sx={{ textTransform: "uppercase" }}
            >
              {isLoading ? "Saving..." : "Update password"}
            </Button>
          </Stack>
        </Box>

        <Stack direction="row" justifyContent="space-between">
          <Link href="/login">Back to login</Link>
          <Link href="/forgot-password">Request new link</Link>
        </Stack>
      </Paper>
    </Container>
  );
}

export default ResetPasswordPage;
