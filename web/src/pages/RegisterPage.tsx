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
import { AuthSocialButtons } from "../components/auth/AuthSocialButtons";
import { EmailField } from "../components/formFields/EmailField";
import {
  InternationalPhoneField,
  buildInternationalPhone,
  getDefaultPhoneCountry,
} from "../components/formFields/InternationalPhoneField";
import { getLocaleDefaults } from "../helpers/locale";
import { useApi } from "../hooks/useApi";
import { getLogoSrc } from "../helpers/logo";
import { useAuth } from "../context/authContext";

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
  const [organizationInviteError, setOrganizationInviteError] =
    useState<string | null>(null);
  const [pendingMeetLink, setPendingMeetLink] = useState<{
    attendeeId: string;
    shareCode: string;
  } | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<
    null | "google" | "microsoft" | "facebook" | "email"
  >(null);
  const { registerAsync, isLoading, error } = useRegister();
  const api = useApi();
  const nav = useNavigate();
  const { refreshSession } = useAuth();
  const [emailError, setEmailError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const logoSrc = getLogoSrc();
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as
    | string
    | undefined;
  const recaptchaDisabled =
    import.meta.env.VITE_RECAPTCHA_DISABLE === "true";
  const captchaRequired =
    Boolean(recaptchaSiteKey) &&
    !recaptchaDisabled &&
    !pendingMeetLink?.attendeeId;
  const shouldShowCaptchaWarning =
    !recaptchaSiteKey && !pendingMeetLink?.attendeeId && !recaptchaDisabled;
  const chooseMethod = (
    method: null | "google" | "microsoft" | "facebook" | "email",
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
      shareCode?: string;
      attendeeId?: string;
    };
    if (
      state.firstName ||
      state.lastName ||
      state.email ||
      state.phoneCountry ||
      state.phoneLocal ||
      state.organizationId ||
      state.shareCode ||
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
      if (state.shareCode && state.attendeeId) {
        setPendingMeetLink({
          shareCode: state.shareCode,
          attendeeId: state.attendeeId,
        });
      }
      setSelectedMethod("email");
      prefillApplied.current = true;
    }
  }, [location.state]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orgFromQuery = params.get("org") || "";
    if (orgFromQuery) {
      setOrganizationId(orgFromQuery);
    }
    let isActive = true;
    const readOrgHeader = async () => {
      try {
        const res = await fetch(window.location.href, { method: "HEAD" });
        const orgFromHeader = res.headers.get("X-Organization-Id") || "";
        if (orgFromHeader && isActive) {
          setOrganizationId(orgFromHeader);
        }
      } catch (err) {
        console.warn("Failed to read organization header", err);
      }
    };
    readOrgHeader();
    return () => {
      isActive = false;
    };
  }, [location.search]);

  useEffect(() => {
    let isActive = true;
    const checkOrganizationInvite = async () => {
      if (!organizationId) {
        setOrganizationInviteError(null);
        return;
      }
      try {
        await api.get<{ allowed: boolean }>(
          `/auth/register/organization?organizationId=${encodeURIComponent(
            organizationId,
          )}`,
        );
        if (isActive) {
          setOrganizationInviteError(null);
        }
      } catch (err: any) {
        if (!isActive) return;
        if (err?.status === 403 || err?.status === 404) {
          setOrganizationInviteError("Invalid organisation invitation link");
        } else {
          setOrganizationInviteError("Invalid organisation invitation link");
        }
      }
    };
    checkOrganizationInvite();
    return () => {
      isActive = false;
    };
  }, [api, organizationId]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (captchaRequired && !captchaToken) {
      return;
    }
    if (organizationInviteError) {
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
      attendeeId: pendingMeetLink?.attendeeId,
    })
      .then(async () => {
        await refreshSession();
        if (pendingMeetLink) {
          nav(
            `/meets/${pendingMeetLink.shareCode}/${pendingMeetLink.attendeeId}`,
          );
        } else {
          nav("/");
        }
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
      `/auth/register/check?email=${encodeURIComponent(value)}`,
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
            {organizationInviteError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {organizationInviteError}
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
                ) : shouldShowCaptchaWarning ? (
                  <Alert severity="warning">
                    reCAPTCHA is not configured; set VITE_RECAPTCHA_SITE_KEY to
                    enable.
                  </Alert>
                ) : null}
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  sx={{ textTransform: "uppercase" }}
                  disabled={
                    Boolean(emailError) ||
                    Boolean(organizationInviteError) ||
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
