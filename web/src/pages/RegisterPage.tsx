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
import { useEffect, useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useRegister } from "../hooks/useRegister";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthSocialButtons } from "../components/AuthSocialButtons";
import { EmailField } from "../components/EmailField";
import {
  InternationalPhoneField,
  buildInternationalPhone,
  getDefaultPhoneCountry,
} from "../components/InternationalPhoneField";
import { getLocaleDefaults } from "../helpers/locale";
import { useApi } from "../hooks/useApi";
import { getLogoSrc } from "../helpers/logo";

function RegisterPage() {
  const location = useLocation();
  const prefillApplied = useRef(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneCountry, setPhoneCountry] = useState(() => {
    const localeCountry = getLocaleDefaults().countryCode;
    return getDefaultPhoneCountry(localeCountry);
  });
  const [phoneLocal, setPhoneLocal] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [pendingMeetLink, setPendingMeetLink] = useState<{
    meetId: string;
    attendeeId: string;
  } | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<
    null | "google" | "microsoft" | "facebook" | "email"
  >(null);
  const { registerAsync, isLoading, error } = useRegister();
  const api = useApi();
  const navigate = useNavigate();
  const [emailError, setEmailError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const logoSrc = getLogoSrc();
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as
    | string
    | undefined;
  const captchaRequired = Boolean(recaptchaSiteKey);
  const chooseMethod = (
    method: null | "google" | "microsoft" | "facebook" | "email"
  ) => {
    setSelectedMethod(method);
    setCaptchaToken(null);
  };

  useEffect(() => {
    if (prefillApplied.current) return;
    const state = (location.state || {}) as {
      firstName?: string;
      lastName?: string;
      email?: string;
      phoneCountry?: string;
      phoneLocal?: string;
      organizationId?: string;
      meetId?: string;
      attendeeId?: string;
    };
    if (
      state.firstName ||
      state.lastName ||
      state.email ||
      state.phoneCountry ||
      state.phoneLocal ||
      state.organizationId ||
      state.meetId ||
      state.attendeeId
    ) {
      setFirstName(state.firstName || "");
      setLastName(state.lastName || "");
      setEmail(state.email || "");
      if (state.phoneCountry) {
        setPhoneCountry(state.phoneCountry);
      }
      setPhoneLocal(state.phoneLocal || "");
      setOrganizationId(state.organizationId || "");
      if (state.meetId && state.attendeeId) {
        setPendingMeetLink({
          meetId: state.meetId,
          attendeeId: state.attendeeId,
        });
      }
      setSelectedMethod("email");
      prefillApplied.current = true;
    }
  }, [location.state]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (captchaRequired && !captchaToken) {
      return;
    }
    registerAsync({
      firstName,
      lastName,
      phone: buildInternationalPhone(phoneCountry, phoneLocal),
      email,
      password,
      organizationId: organizationId || undefined,
      captchaToken: captchaToken || undefined,
    })
      .then(async () => {
        if (pendingMeetLink) {
          const me = await api.get<{ id: string }>("/auth/me");
          await api.patch(
            `/meets/${pendingMeetLink.meetId}/attendees/${pendingMeetLink.attendeeId}`,
            { userId: me.id }
          );
        }
        navigate("/");
      })
      .catch((err) => {
        console.error("Registration failed", err);
      });
  };

  const checkEmail = async () => {
    const value = email.trim();
    if (!value) {
      setEmailError(null);
      return;
    }
    const res = await api.get<{ exists: boolean }>(
      `/auth/register/check?email=${encodeURIComponent(value)}`
    );
    setEmailError(res.exists ? "This email is already registered." : null);
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
          Create account
        </Typography>
        {!selectedMethod && (
          <AuthSocialButtons showEmail onSelect={chooseMethod} />
        )}
        {selectedMethod && selectedMethod !== "email" && (
          <Stack spacing={2}>
            <Alert severity="info">
              Continue with {selectedMethod} is not configured yet.
            </Alert>
            <Button variant="text" onClick={() => chooseMethod(null)}>
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
                <InternationalPhoneField
                  label="Phone"
                  required
                  country={phoneCountry}
                  local={phoneLocal}
                  onCountryChange={setPhoneCountry}
                  onLocalChange={setPhoneLocal}
                />
                <EmailField
                  required
                  value={email}
                  onChange={(value) => setEmail(value)}
                  onBlur={checkEmail}
                />
                {emailError && <Alert severity="warning">{emailError}</Alert>}
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
                {captchaRequired ? (
                  <Box display="flex" justifyContent="center">
                    <ReCAPTCHA
                      sitekey={recaptchaSiteKey}
                      onChange={(token) => setCaptchaToken(token)}
                      onExpired={() => setCaptchaToken(null)}
                    />
                  </Box>
                ) : (
                  <Alert severity="warning">
                    reCAPTCHA is not configured; set VITE_RECAPTCHA_SITE_KEY to
                    enable.
                  </Alert>
                )}
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  sx={{ textTransform: "uppercase" }}
                  disabled={
                    Boolean(emailError) ||
                    (captchaRequired && !captchaToken) ||
                    isLoading
                  }
                >
                  {isLoading ? "Creating..." : "Create account"}
                </Button>
                <Button variant="text" onClick={() => chooseMethod(null)}>
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
