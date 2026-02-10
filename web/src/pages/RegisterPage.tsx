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
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import { useEffect, useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useRegister } from "../hooks/useRegister";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthSocialButtons } from "../components/auth/AuthSocialButtons";
import { EmailField } from "../components/formFields/EmailField";
import {
  buildInternationalPhone,
  InternationalPhoneField,
} from "../components/formFields/InternationalPhoneField";
import { PasswordField } from "../components/formFields/PasswordField";
import { PasswordStrength } from "../components/formFields/PasswordStrength";
import { useCheckEmailExists } from "../hooks/useCheckEmailExists";
import { validateEmail, validatePhone, validateRequired } from "../helpers/validation";
import { useApi } from "../hooks/useApi";
import { getLogoSrc } from "../helpers/logo";
import { useAuth } from "../context/authContext";
import zxcvbn from "zxcvbn";

const getPasswordStrength = (value: string) => {
  if (!value) return { score: 0, label: "Enter a password" };
  const result = zxcvbn(value);
  const score = result.score; // 0-4
  const label =
    score <= 1
      ? "Weak"
      : score === 2
        ? "Fair"
        : score === 3
          ? "Good"
          : "Strong";
  return { score, label };
};

function RegisterPage() {
  const location = useLocation();
  const prefillApplied = useRef(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [password, setPassword] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [organizationInviteError, setOrganizationInviteError] = useState<
    string | null
  >(null);
  const [pendingMeetLink, setPendingMeetLink] = useState<{
    attendeeId: string;
    shareCode: string;
  } | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<
    null | "google" | "microsoft" | "facebook" | "email"
  >(null);
  const { registerAsync, isLoading, error } = useRegister();
  const { checkEmailExistsAsync } = useCheckEmailExists();
  const api = useApi();
  const nav = useNavigate();
  const { refreshSession } = useAuth();
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const logoSrc = getLogoSrc();
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as
    | string
    | undefined;
  const recaptchaDisabled = import.meta.env.VITE_RECAPTCHA_DISABLE === "true";
  const captchaRequired =
    Boolean(recaptchaSiteKey) &&
    !recaptchaDisabled &&
    !pendingMeetLink?.attendeeId;
  const shouldShowCaptchaWarning =
    !recaptchaSiteKey && !pendingMeetLink?.attendeeId;
  const passwordStrength = getPasswordStrength(password);
  const passwordStrengthPercent = Math.round(
    (passwordStrength.score / 4) * 100,
  );
  const isFormValid =
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    phoneLocal.trim() !== "" &&
    email.trim() !== "" &&
    password.trim() !== "" &&
    passwordStrength.score > 1 &&
    (!captchaRequired || Boolean(captchaToken)) &&
    !emailError &&
    !phoneError &&
    !firstNameError &&
    !lastNameError &&
    !organizationInviteError;
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
      organizationId?: string;
      meetId?: string;
      shareCode?: string;
      attendeeId?: string;
    };
    if (
      state.firstName ||
      state.lastName ||
      state.email ||
      state.organizationId ||
      state.shareCode ||
      state.attendeeId
    ) {
      setFirstName(state.firstName || "");
      setLastName(state.lastName || "");
      setEmail(state.email || "");
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
      email,
      phone: buildInternationalPhone(phoneCountry, phoneLocal),
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
        console.warn("Registration failed", err);
      });
  };

  const checkEmail = async () => {
    const value = email.trim();
    if (!value) {
      setEmailError(validateEmail(value));
      return;
    }
    const formatError = validateEmail(value);
    if (formatError) {
      setEmailError(formatError);
      return;
    }
    const res = await checkEmailExistsAsync(value);
    setEmailError(res.exists ? "This email is already registered." : null);
  };

  const checkPhone = () => {
    setPhoneError(validatePhone(phoneLocal));
  };

  const checkFirstName = () => {
    setFirstNameError(validateRequired(firstName, "First name"));
  };

  const checkLastName = () => {
    setLastNameError(validateRequired(lastName, "Last name"));
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
      {(!selectedMethod || selectedMethod !== "email") && (
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <img
            src={logoSrc}
            alt="AdventureMeets logo"
            width={320}
            height="auto"
          />
        </Box>
      )}

      <Paper elevation={2} sx={{ width: "100%", p: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography variant="h5">Create account</Typography>
        </Box>
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
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: 2,
                }}
              >
                <TextField
                  label="First name"
                  required
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (firstNameError) setFirstNameError(null);
                  }}
                  onBlur={checkFirstName}
                  error={Boolean(firstNameError)}
                  helperText={firstNameError || undefined}
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
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (lastNameError) setLastNameError(null);
                  }}
                  onBlur={checkLastName}
                  error={Boolean(lastNameError)}
                  helperText={lastNameError || undefined}
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
                  onLocalChange={(value) => {
                    setPhoneLocal(value);
                    if (phoneError) {
                      setPhoneError(null);
                    }
                  }}
                  onBlur={checkPhone}
                  error={Boolean(phoneError)}
                  helperText={phoneError || undefined}
                />
                <EmailField
                  required
                  value={email}
                  onChange={(value) => {
                    setEmail(value);
                    if (emailError) {
                      setEmailError(null);
                    }
                  }}
                  onBlur={checkEmail}
                  error={Boolean(emailError)}
                  helperText={emailError || undefined}
                />
                <PasswordField
                  label="Password"
                  required
                  value={password}
                  onValueChange={setPassword}
                />
                <PasswordStrength
                  label={passwordStrength.label}
                  percent={passwordStrengthPercent}
                  score={passwordStrength.score}
                />
                {captchaRequired ? (
                  <Box display="flex" justifyContent="center" sx={{ mt: -1 }}>
                    <ReCAPTCHA
                      sitekey={recaptchaSiteKey}
                      onChange={(token) => setCaptchaToken(token)}
                      onExpired={() => setCaptchaToken(null)}
                    />
                  </Box>
                ) : shouldShowCaptchaWarning ? (
                  <Alert severity="warning" sx={{ mt: -1 }}>
                    reCAPTCHA is not configured; set VITE_RECAPTCHA_SITE_KEY to
                    enable.
                  </Alert>
                ) : null}
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  sx={{ textTransform: "uppercase" }}
                  disabled={!isFormValid || isLoading}
                >
                  {isLoading ? "Creating..." : "Create account"}
                </Button>
              </Box>
            </Box>
          </>
        )}

        <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
          <Link href="/login">Already have an account?</Link>
          {selectedMethod === "email" && (
            <Link
              component="button"
              type="button"
              onClick={() => chooseMethod(null)}
            >
              Choose another method
            </Link>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}

export default RegisterPage;
