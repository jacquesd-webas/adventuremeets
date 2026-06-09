import {
  Alert,
  Box,
  Button,
  Container,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useFetchMeetSignup } from "../hooks/useFetchMeetSignup";
import { MeetNotFound } from "../components/meet/MeetNotFound";
import { MeetInfoSummary } from "../components/meet/MeetInfoSummary";
import { NameField } from "../components/formFields/NameField";
import { EmailField } from "../components/formFields/EmailField";
import {
  InternationalPhoneField,
  buildInternationalPhone,
  getDefaultPhoneCountry,
  splitInternationalPhone,
} from "../components/formFields/InternationalPhoneField";
import { getLocaleDefaults } from "../helpers/locale";
import {
  validateEmail,
  validatePhone,
  validateRequired,
} from "../helpers/validation";
import { useCheckMeetAttendee } from "../hooks/useCheckMeetAttendee";
import { useUpdateMeetAttendeeByCode } from "../hooks/useUpdateMeetAttendeeByCode";
import { useAddAttendee } from "../hooks/useAddAttendee";
import { useAuth } from "../context/authContext";
import { useFetchOrganization } from "../hooks/useFetchOrganization";
import { useThemeMode } from "../context/ThemeModeContext";
import { getOrganizationBackground } from "../helpers/organizationTheme";

function MeetSelfCheckinPage() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: meet, isLoading } = useFetchMeetSignup(code);
  const { data: organization } = useFetchOrganization(
    meet?.organizationId || undefined,
  );
  const { mode } = useThemeMode();
  const { user, isAuthenticated } = useAuth();
  const { checkAttendeeAsync, isLoading: isCheckingAttendee } =
    useCheckMeetAttendee();
  const { updateMeetAttendeeByCodeAsync, isLoading: isCheckingIn } =
    useUpdateMeetAttendeeByCode();
  const { addAttendeeAsync, isLoading: isAddingAttendee } = useAddAttendee();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isMinor, setIsMinor] = useState(false);
  const [guardianName, setGuardianName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [guardianNameError, setGuardianNameError] = useState<string | null>(
    null,
  );
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successState, setSuccessState] = useState<{
    attendeeId: string;
    name: string;
    isWalkIn: boolean;
  } | null>(null);
  const [phoneCountry, setPhoneCountry] = useState(() => {
    const localeCountry = getLocaleDefaults().countryCode;
    return getDefaultPhoneCountry(localeCountry);
  });
  const [phoneLocal, setPhoneLocal] = useState("");
  const pin = searchParams.get("pin")?.trim() || "";
  const showEmailField = meet?.requireEmail !== false;
  const showPhoneField = meet?.requirePhone !== false;
  const canWalkIn = Boolean(meet?.allowWalkins);
  const canMatchByContact = showEmailField || showPhoneField;
  const isSubmitting = isCheckingAttendee || isCheckingIn || isAddingAttendee;

  useEffect(() => {
    if (!user || !isAuthenticated) return;
    const loggedInName =
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.idp_profile?.name ||
      "";
    if (loggedInName) {
      setFullName(loggedInName);
    }
    if (showEmailField && user.email) {
      setEmail(user.email);
    }
    if (showPhoneField && user.phone) {
      const parsed = splitInternationalPhone(user.phone);
      setPhoneCountry(parsed.country);
      setPhoneLocal(parsed.local);
    }
  }, [isAuthenticated, showEmailField, showPhoneField, user]);

  useEffect(() => {
    const previousBackgroundColor = document.body.style.backgroundColor;
    const previousBackgroundImage = document.body.style.backgroundImage;
    const previousOrgTheme = document.body.getAttribute("data-org-theme");
    const previousThemeBase = document.body.getAttribute("data-theme-base");

    const resolvedBase =
      mode === "glass"
        ? window.localStorage.getItem("themeBaseMode") || "light"
        : mode;
    const { image, color } = getOrganizationBackground(
      mode,
      organization?.theme,
    );
    document.body.style.backgroundColor = color;
    document.body.style.backgroundImage = `url("${image}")`;
    document.body.setAttribute("data-theme-base", resolvedBase);

    if (organization?.theme) {
      document.body.setAttribute("data-org-theme", organization.theme);
    } else {
      document.body.removeAttribute("data-org-theme");
    }

    return () => {
      document.body.style.backgroundColor = previousBackgroundColor;
      document.body.style.backgroundImage = previousBackgroundImage;
      if (previousOrgTheme) {
        document.body.setAttribute("data-org-theme", previousOrgTheme);
      } else {
        document.body.removeAttribute("data-org-theme");
      }
      if (previousThemeBase) {
        document.body.setAttribute("data-theme-base", previousThemeBase);
      } else {
        document.body.removeAttribute("data-theme-base");
      }
    };
  }, [mode, organization?.theme]);

  const isValidLink = useMemo(() => {
    if (!meet) return false;
    if (!meet.allowSelfCheckin) return false;
    if (!meet.checkinPin) return false;
    return pin === meet.checkinPin;
  }, [meet, pin]);

  const handleSubmit = async () => {
    if (!meet || !code) return;

    const nextNameError = validateRequired(fullName, "Name");
    const nextGuardianNameError =
      isMinor && !guardianName.trim()
        ? validateRequired(guardianName, "Parent or guardian name")
        : null;
    const nextEmailError = showEmailField ? validateEmail(email) : null;
    const nextPhoneError = showPhoneField ? validatePhone(phoneLocal) : null;

    setNameError(nextNameError);
    setGuardianNameError(nextGuardianNameError);
    setEmailError(nextEmailError);
    setPhoneError(nextPhoneError);
    setFormError(null);

    if (
      nextNameError ||
      nextGuardianNameError ||
      nextEmailError ||
      nextPhoneError
    ) {
      return;
    }

    if (!canMatchByContact && !canWalkIn) {
      setFormError(
        "This meet requires organiser check-in because it does not collect email or phone for attendee matching.",
      );
      return;
    }

    const submittedEmail = showEmailField ? email.trim() : "";
    const submittedPhone = showPhoneField
      ? buildInternationalPhone(phoneCountry, phoneLocal)
      : "";

    let matchedAttendeeId: string | null = null;
    let matchedAttendeeName: string | null = null;

    if (submittedEmail || submittedPhone) {
      const check = await checkAttendeeAsync({
        meetId: meet.id,
        email: submittedEmail || undefined,
        phone: submittedPhone || undefined,
      });
      if (check.attendee) {
        matchedAttendeeId = check.attendee.id;
        matchedAttendeeName = check.attendee.name || fullName;
      }
    }

    if (matchedAttendeeId) {
      await updateMeetAttendeeByCodeAsync({
        meetCode: code,
        attendeeId: matchedAttendeeId,
        status: "checked-in",
      });
      setSuccessState({
        attendeeId: matchedAttendeeId,
        name: matchedAttendeeName || fullName,
        isWalkIn: false,
      });
      return;
    }

    if (!canWalkIn) {
      setFormError(
        "We couldn't find your attendee record. Please ask the organiser to check you in.",
      );
      return;
    }

    const created = await addAttendeeAsync({
      meetId: meet.id,
      userId: isAuthenticated ? user?.id : undefined,
      name: fullName.trim(),
      email: submittedEmail || undefined,
      phone: submittedPhone || undefined,
      isMinor,
      GuardianName: isMinor ? guardianName.trim() || undefined : undefined,
    });

    await updateMeetAttendeeByCodeAsync({
      meetCode: code,
      attendeeId: created.attendee.id,
      status: "checked-in",
    });

    setSuccessState({
      attendeeId: created.attendee.id,
      name: fullName.trim(),
      isWalkIn: true,
    });
  };

  const handleOpenStatus = () => {
    if (!code || !successState?.attendeeId) return;
    navigate(`/meets/${code}/${successState.attendeeId}`);
  };

  if (!isLoading && (!meet || !isValidLink)) {
    return <MeetNotFound />;
  }

  if (successState && meet) {
    return (
      <Container
        maxWidth="sm"
        sx={{ py: isMobile ? 0 : 3, minHeight: "100vh" }}
      >
        <Paper
          elevation={0}
          sx={{
            p: isMobile ? 2 : 3,
            borderRadius: isMobile ? 0 : 3,
            minHeight: isMobile ? "100vh" : undefined,
          }}
        >
          <Stack spacing={3}>
            <MeetInfoSummary meet={meet} isPreview={false} showUserAction={false} />
            <Alert severity="success">
              {successState.isWalkIn
                ? `${successState.name} has been added as a walk-in and checked in.`
                : `${successState.name} is checked in.`}
            </Alert>
            <Stack direction="row" justifyContent="center">
              <Button variant="contained" onClick={handleOpenStatus}>
                Open status page
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="sm"
      sx={{ py: isMobile ? 0 : 3, minHeight: "100vh" }}
    >
      <Paper
        elevation={0}
        sx={{
          p: isMobile ? 2 : 3,
          borderRadius: isMobile ? 0 : 3,
          minHeight: isMobile ? "100vh" : undefined,
        }}
      >
        <Stack spacing={3}>
          {meet ? (
            <MeetInfoSummary meet={meet} isPreview={false} showUserAction={false} />
          ) : null}

          <Stack spacing={1}>
            <Typography variant="h5" fontWeight={700}>
              Self check-in
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {canWalkIn
                ? "Enter your details to match your attendee record and check in. If we can't find a match, you'll be added as a walk-in."
                : "Enter your details to match your attendee record and check in."}
            </Typography>
          </Stack>

          {!canMatchByContact && !canWalkIn ? (
            <Alert severity="warning">
              This meet does not collect email or phone, so self check-in cannot
              match attendees automatically. Please ask the organiser to check
              you in.
            </Alert>
          ) : null}

          {formError ? <Alert severity="error">{formError}</Alert> : null}

          <Stack spacing={2}>
            <Stack spacing={0.5}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Typography variant="subtitle2" fontWeight={700}>
                  Name <span style={{ color: "#ef4444" }}>*</span>
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={isMinor}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setIsMinor(checked);
                        if (!checked) {
                          setGuardianName("");
                          setGuardianNameError(null);
                        }
                      }}
                    />
                  }
                  label="Fill in on-behalf of a minor"
                  labelPlacement="start"
                  sx={{
                    m: 0,
                    "& .MuiFormControlLabel-label": {
                      fontSize: 12,
                      color: "text.secondary",
                    },
                  }}
                />
              </Box>
              <NameField
                required
                value={fullName}
                onChange={setFullName}
                onBlur={() => setNameError(validateRequired(fullName, "Name"))}
                error={Boolean(nameError)}
                helperText={nameError || undefined}
                placeholder={
                  isMinor ? "Name of person attending the meet" : "Your name"
                }
              />
            </Stack>

            {isMinor ? (
              <>
                <Alert severity="info">
                  Use the parent or guardian contact details below so we can
                  match or create the correct attendee record.
                </Alert>
                <NameField
                  required
                  value={guardianName}
                  onChange={setGuardianName}
                  onBlur={() =>
                    setGuardianNameError(
                      validateRequired(guardianName, "Parent or guardian name"),
                    )
                  }
                  error={Boolean(guardianNameError)}
                  helperText={guardianNameError || undefined}
                  placeholder="Parent or guardian name"
                />
              </>
            ) : null}

            {showEmailField ? (
              <EmailField
                required
                value={email}
                onChange={setEmail}
                onBlur={() => setEmailError(validateEmail(email))}
                error={Boolean(emailError)}
                helperText={emailError || undefined}
              />
            ) : null}

            {showPhoneField ? (
              <InternationalPhoneField
                required
                country={phoneCountry}
                local={phoneLocal}
                onCountryChange={setPhoneCountry}
                onLocalChange={setPhoneLocal}
                onBlur={() => setPhoneError(validatePhone(phoneLocal))}
                error={Boolean(phoneError)}
                helperText={phoneError || undefined}
              />
            ) : null}

            <Stack direction="row" justifyContent="center" pt={1}>
              <Button
                variant="contained"
                onClick={() => void handleSubmit()}
                disabled={isSubmitting || (!canMatchByContact && !canWalkIn)}
              >
                Check in
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}

export default MeetSelfCheckinPage;
