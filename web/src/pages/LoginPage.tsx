import {
  Box,
  Button,
  Container,
  Drawer,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import { useState } from "react";
import { useLogin } from "../hooks/useLogin";
import { useNavigate } from "react-router-dom";
import { AuthSocialButtons } from "../components/auth/AuthSocialButtons";
import { getLogoSrc } from "../helpers/logo";
import { useAuth } from "../context/authContext";
import { PasswordField } from "../components/formFields/PasswordField";

function LoginPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
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

  const loginContent = (
    <>
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
          <PasswordField
            label="Password"
            required
            value={password}
            onValueChange={setPassword}
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
        <Link href="/forgot-password">Forgot password?</Link>
      </Stack>
    </>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
      }}
    >
      <Container
        maxWidth="sm"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          py: isMobile ? 4 : 8,
        }}
      >
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <img
            src={logoSrc}
            alt="AdventureMeets logo"
            width={isMobile ? 260 : 320}
            height="auto"
          />
        </Box>
        {!isMobile && (
          <Paper elevation={2} sx={{ width: "100%", p: 3 }}>
            {loginContent}
          </Paper>
        )}
      </Container>
      {isMobile && (
        <Drawer
          anchor="bottom"
          open={true}
          onClose={(_event, reason) => {
            if (reason === "backdropClick" || reason === "escapeKeyDown")
              return;
          }}
          disableEscapeKeyDown
          slotProps={{
            backdrop: {
              sx: { backgroundColor: "rgba(0,0,0,0.35)" },
            },
          }}
          ModalProps={{
            keepMounted: true,
            disableAutoFocus: true,
            disableEnforceFocus: true,
            disableRestoreFocus: true,
          }}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: "78vh",
              overflowY: "auto",
              pb: "calc(16px + env(safe-area-inset-bottom))",
            },
          }}
        >
          <Box sx={{ px: 2, pt: 2, pb: 2.5 }}>{loginContent}</Box>
        </Drawer>
      )}
    </Box>
  );
}

export default LoginPage;
