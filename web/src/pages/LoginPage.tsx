import {
  Box,
  Button,
  Container,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useState } from "react";
import { useLogin } from "../hooks/useLogin";
import { useNavigate } from "react-router-dom";
import { AuthSocialButtons } from "../components/auth/AuthSocialButtons";
import { getLogoSrc } from "../helpers/logo";
import { useAuth } from "../context/authContext";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { loginAsync, isLoading, error } = useLogin();
  const { refreshSession } = useAuth();
  const nav = useNavigate();
  const logoSrc = getLogoSrc();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    loginAsync({ email, password })
      .then(() => {
        refreshSession();
        nav("/");
      })
      .catch((err) => {
        console.error("Login failed", err);
      });
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
        <img
          src={logoSrc}
          alt="AdventureMeets logo"
          width={320}
          height="auto"
        />
      </Box>

      <Paper elevation={2} sx={{ width: "100%", p: 3 }}>
        <Typography variant="h5" mb={2}>
          Login
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.message}
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
              InputProps={{
                startAdornment: (
                  <EmailOutlinedIcon
                    fontSize="small"
                    sx={{ mr: 1, color: "text.disabled" }}
                  />
                ),
              }}
            />
            <TextField
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              sx={{ textTransform: "uppercase" }}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </Stack>
        </Box>

        <AuthSocialButtons compact />

        <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
          <Link href="/register">Create Account</Link>
          <Link href="#">Forgot password?</Link>
        </Stack>
      </Paper>
    </Container>
  );
}

export default LoginPage;
