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
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import { useState } from "react";
import { useRegister } from "../hooks/useRegister";
import { useNavigate } from "react-router-dom";
import { AuthSocialButtons } from "../components/AuthSocialButtons";
import { EmailField } from "../components/EmailField";

function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<
    null | "google" | "microsoft" | "facebook" | "email"
  >(null);
  const { registerAsync, isLoading, error } = useRegister();
  const navigate = useNavigate();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    registerAsync({ firstName, lastName, phone, email, password })
      .then(() => navigate("/"))
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("Registration failed", err);
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
          src="/static/meetplanner-logo.svg"
          alt="Meetplanner logo"
          width={350}
          height="auto"
        />
      </Box>

      <Paper elevation={2} sx={{ width: "100%", p: 3 }}>
        <Typography variant="h5" mb={2}>
          Create account
        </Typography>
        {!selectedMethod && (
          <AuthSocialButtons showEmail onSelect={setSelectedMethod} />
        )}
        {selectedMethod && selectedMethod !== "email" && (
          <Stack spacing={2}>
            <Alert severity="info">
              Continue with {selectedMethod} is not configured yet.
            </Alert>
            <Button variant="text" onClick={() => setSelectedMethod(null)}>
              Choose another method
            </Button>
          </Stack>
        )}
        {selectedMethod === "email" && (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error.message}
              </Alert>
            )}
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="First name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <PersonOutlineIcon
                        fontSize="small"
                        sx={{ mr: 1, color: "text.disabled" }}
                      />
                    ),
                  }}
                />
                <TextField
                  label="Last name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <PersonOutlineIcon
                        fontSize="small"
                        sx={{ mr: 1, color: "text.disabled" }}
                      />
                    ),
                  }}
                />
                <TextField
                  label="Phone"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <PhoneOutlinedIcon
                        fontSize="small"
                        sx={{ mr: 1, color: "text.disabled" }}
                      />
                    ),
                  }}
                />
                <EmailField
                  required
                  value={email}
                  onChange={(value) => setEmail(value)}
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
                  {isLoading ? "Creating..." : "Create account"}
                </Button>
                <Button variant="text" onClick={() => setSelectedMethod(null)}>
                  Choose another method
                </Button>
              </Stack>
            </Box>
          </>
        )}

        <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
          <Link href="/login">Already have an account?</Link>
        </Stack>
      </Paper>
    </Container>
  );
}

export default RegisterPage;
