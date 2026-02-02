import { Alert, Box, Button, Stack, TextField } from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useState } from "react";
import { useLogin } from "../../hooks/useLogin";
import { useAuth } from "../../context/authContext";
import { useNavigate } from "react-router-dom";

type LoginFormProps = {
  onSuccess?: () => void;
  submitLabel?: string;
};

export function LoginForm({
  onSuccess,
  submitLabel = "Login",
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { loginAsync, isLoading, error } = useLogin();
  const { refreshSession } = useAuth();
  const nav = useNavigate();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    loginAsync({ email, password })
      .then(() => refreshSession())
      .then(() => {
        if (onSuccess) {
          onSuccess();
          return;
        }
        nav("/");
      })
      .catch((err) => {
        console.error("Login failed", err);
      });
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error.message}</Alert>}
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
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : submitLabel}
        </Button>
      </Stack>
    </Box>
  );
}
