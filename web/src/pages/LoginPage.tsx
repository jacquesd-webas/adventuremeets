import { Box, Button, Container, Divider, Link, Paper, Stack, TextField, Typography, Alert } from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useState } from "react";
import { useLogin } from "../hooks/useLogin";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { loginAsync, isLoading, error } = useLogin();
  const navigate = useNavigate();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    loginAsync({ email, password })
      .then(() => navigate("/"))
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("Login failed", err);
      });
  };

  return (
    <Container maxWidth="sm" sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8 }}>
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <img src="/static/meetplanner-logo.svg" alt="Meetplanner logo" width={350} height="auto" />
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
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: <EmailOutlinedIcon fontSize="small" sx={{ mr: 1, color: "text.disabled" }} />
              }}
            />
            <TextField
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: <LockOutlinedIcon fontSize="small" sx={{ mr: 1, color: "text.disabled" }} />
              }}
            />
            <Button type="submit" variant="contained" size="large" sx={{ textTransform: "uppercase" }}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />
        <Stack spacing={1.5}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<img src="/static/google.svg" alt="Google" width={20} height={20} />}
          >
            Continue with Google
          </Button>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<img src="/static/microsoft.svg" alt="Microsoft" width={20} height={20} />}
          >
            Continue with Microsoft
          </Button>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<img src="/static/facebook.svg" alt="Facebook" width={20} height={20} />}
          >
            Continue with Facebook
          </Button>
        </Stack>

        <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
          <Link href="#">Create Account</Link>
          <Link href="#">Forgot password?</Link>
        </Stack>
      </Paper>
    </Container>
  );
}

export default LoginPage;
