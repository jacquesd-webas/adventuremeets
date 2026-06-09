import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { MeetNotFound } from "../components/meet/MeetNotFound";
import { NameField } from "../components/formFields/NameField";
import { EmailField } from "../components/formFields/EmailField";
import {
  InternationalPhoneField,
  buildInternationalPhone,
  getDefaultPhoneCountry,
  splitInternationalPhone,
} from "../components/formFields/InternationalPhoneField";
import { getLocaleDefaults } from "../helpers/locale";
import { validateEmail, validatePhone } from "../helpers/validation";
import { useFetchMeetSignup } from "../hooks/useFetchMeetSignup";
import { useCheckMeetAttendee } from "../hooks/useCheckMeetAttendee";
import { useUpdateMeetAttendeeByCode } from "../hooks/useUpdateMeetAttendeeByCode";
import { useAuth } from "../context/authContext";
import { useFetchOrganization } from "../hooks/useFetchOrganization";
import { useThemeMode } from "../context/ThemeModeContext";
import { getOrganizationBackground } from "../helpers/organizationTheme";
import AttendeeStatusEnum from "../types/AttendeeStatusEnum";
import {
  MeetSelfCheckinMatchDialog,
  type MatchAttendee,
} from "../components/meet/MeetSelfCheckinMatchDialog";

function isAlreadyCheckedInStatus(status?: string) {
  return (
    status === AttendeeStatusEnum.CheckedIn ||
    status === AttendeeStatusEnum.Attended
  );
}

function normalizeMatchValue(value?: string) {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") || "";
}

function buildAttendeeSignature(attendee: MatchAttendee) {
  return [
    normalizeMatchValue(attendee.name),
    normalizeMatchValue(attendee.email),
    normalizeMatchValue(attendee.phone),
  ].join("|");
}

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [matchCandidates, setMatchCandidates] = useState<MatchAttendee[]>([]);
  const [matchedAttendees, setMatchedAttendees] = useState<MatchAttendee[]>([]);
  const [lookupResultKey, setLookupResultKey] = useState("");
  const [phoneCountry, setPhoneCountry] = useState(() => {
    const localeCountry = getLocaleDefaults().countryCode;
    return getDefaultPhoneCountry(localeCountry);
  });
  const [phoneLocal, setPhoneLocal] = useState("");
  const lookupRequestIdRef = useRef(0);

  const pin = searchParams.get("pin")?.trim() || "";
  const showEmailField = meet?.requireEmail !== false;
  const showPhoneField = meet?.requirePhone !== false;
  const canWalkIn = Boolean(meet?.allowWalkins);
  const isSubmitting = isCheckingAttendee || isCheckingIn;

  const submittedName = fullName.trim();
  const submittedEmail = showEmailField ? email.trim() : "";
  const submittedPhone = showPhoneField
    ? buildInternationalPhone(phoneCountry, phoneLocal)
    : "";
  const currentLookupKey = [
    normalizeMatchValue(submittedName),
    normalizeMatchValue(submittedEmail),
    normalizeMatchValue(submittedPhone),
  ].join("|");
  const hasLookupInput = Boolean(
    submittedName || submittedEmail || submittedPhone,
  );
  const canCheckIn =
    hasLookupInput &&
    matchedAttendees.length > 0 &&
    lookupResultKey === currentLookupKey &&
    !isSubmitting;
  const showLookupStatus =
    hasLookupInput && lookupResultKey === currentLookupKey && !isSubmitting;

  const signupUrl = useMemo(() => {
    if (!code) return "";
    const params = new URLSearchParams();
    if (pin) params.set("pin", pin);
    if (submittedName) params.set("name", submittedName);
    if (showEmailField && submittedEmail) params.set("email", submittedEmail);
    if (showPhoneField && phoneLocal.trim()) {
      params.set("phoneCountry", phoneCountry);
      params.set("phoneLocal", phoneLocal.trim());
    }
    return `/meets/${code}${params.toString() ? `?${params.toString()}` : ""}`;
  }, [
    code,
    pin,
    submittedName,
    showEmailField,
    submittedEmail,
    showPhoneField,
    phoneCountry,
    phoneLocal,
  ]);

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

  useEffect(() => {
    setMatchedAttendees([]);
    setLookupResultKey("");
  }, [currentLookupKey]);

  useEffect(() => {
    if (!meet || !hasLookupInput) {
      return;
    }

    if (emailError || phoneError) {
      return;
    }

    const requestId = lookupRequestIdRef.current + 1;
    lookupRequestIdRef.current = requestId;

    const timeoutId = window.setTimeout(async () => {
      const check = await checkAttendeeAsync({
        meetId: meet.id,
        name: submittedName || undefined,
        email: submittedEmail || undefined,
        phone: submittedPhone || undefined,
      });

      if (lookupRequestIdRef.current !== requestId) {
        return;
      }

      const matches =
        check.attendees && check.attendees.length
          ? check.attendees
          : check.attendee
            ? [check.attendee]
            : [];

      setMatchedAttendees(matches);
      setLookupResultKey(currentLookupKey);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    canWalkIn,
    checkAttendeeAsync,
    currentLookupKey,
    emailError,
    hasLookupInput,
    meet,
    phoneError,
    submittedEmail,
    submittedName,
    submittedPhone,
  ]);

  const isValidLink = useMemo(() => {
    if (!meet) return false;
    if (!meet.allowSelfCheckin) return false;
    if (!meet.checkinPin) return false;
    return pin === meet.checkinPin;
  }, [meet, pin]);

  const completeCheckin = async (
    attendee: MatchAttendee,
    wasAlreadyCheckedIn = false,
  ) => {
    if (!code) return;

    if (!wasAlreadyCheckedIn) {
      await updateMeetAttendeeByCodeAsync({
        meetCode: code,
        attendeeId: attendee.id,
        status: "checked-in",
      });
    }

    navigate(`/meets/${code}/${attendee.id}`);
  };

  const resolveMatchedAttendees = async (
    attendees: MatchAttendee[],
    matchedEmail: string,
    matchedPhone: string,
  ) => {
    if (!attendees.length) {
      return false;
    }

    const uncheckedAttendees = attendees.filter(
      (attendee) => !isAlreadyCheckedInStatus(attendee.status),
    );

    if (!uncheckedAttendees.length) {
      await completeCheckin(attendees[0], true);
      return true;
    }

    if (uncheckedAttendees.length === 1) {
      await completeCheckin(uncheckedAttendees[0]);
      return true;
    }

    const hasContactDetails = Boolean(matchedEmail || matchedPhone);
    if (!hasContactDetails) {
      await completeCheckin(uncheckedAttendees[0]);
      return true;
    }

    const firstSignature = buildAttendeeSignature(uncheckedAttendees[0]);
    const hasDifferentMatches = uncheckedAttendees.some(
      (attendee) => buildAttendeeSignature(attendee) !== firstSignature,
    );

    if (!hasDifferentMatches) {
      await completeCheckin(uncheckedAttendees[0]);
      return true;
    }

    setMatchCandidates(uncheckedAttendees);
    return true;
  };

  const handleMatchSelection = async (attendee: MatchAttendee) => {
    setMatchCandidates([]);
    await completeCheckin(attendee);
  };

  const handleSubmit = async () => {
    if (!meet || !code) return;

    const nextEmailError =
      showEmailField && submittedEmail ? validateEmail(email) : null;
    const nextPhoneError =
      showPhoneField && phoneLocal.trim() ? validatePhone(phoneLocal) : null;

    setNameError(null);
    setEmailError(nextEmailError);
    setPhoneError(nextPhoneError);

    if (nextEmailError || nextPhoneError) {
      return;
    }

    if (!canCheckIn) {
      return;
    }

    await resolveMatchedAttendees(
      matchedAttendees,
      submittedEmail,
      submittedPhone,
    );
  };

  if (!isLoading && (!meet || !isValidLink)) {
    return <MeetNotFound />;
  }

  return (
    <Container
      maxWidth={isMobile ? false : "md"}
      disableGutters={isMobile}
      sx={{
        py: isMobile ? 0 : 6,
        pt: isMobile ? 0 : 6,
        minHeight: "100vh",
        height: "100%",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: isMobile ? 2 : 3,
          minHeight: "100%",
          borderRadius: isMobile ? 0 : 2,
          boxShadow: isMobile ? "none" : undefined,
        }}
      >
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography variant="h5">{meet?.name} - Check-in</Typography>
            <Typography variant="body2" color="text.secondary">
              {canWalkIn
                ? "Enter any of your details to find your attendee record. If no match is found, you can register for the meet."
                : "Enter any of your details to match your attendee record and check in."}
            </Typography>
          </Stack>

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
                  Name
                </Typography>
              </Box>

              <NameField
                value={fullName}
                onChange={setFullName}
                onBlur={() => setNameError(null)}
                error={Boolean(nameError)}
                helperText={nameError || undefined}
                placeholder="Your name"
              />
            </Stack>

            {showEmailField ? (
              <EmailField
                value={email}
                onChange={setEmail}
                onBlur={() => {
                  const error = email.trim() ? validateEmail(email) : null;
                  setEmailError(error);
                }}
                error={Boolean(emailError)}
                helperText={emailError || undefined}
              />
            ) : null}

            {showPhoneField ? (
              <InternationalPhoneField
                country={phoneCountry}
                local={phoneLocal}
                onCountryChange={setPhoneCountry}
                onLocalChange={setPhoneLocal}
                onBlur={() => {
                  const error = phoneLocal.trim()
                    ? validatePhone(phoneLocal)
                    : null;
                  setPhoneError(error);
                }}
                error={Boolean(phoneError)}
                helperText={phoneError || undefined}
              />
            ) : null}

            <Stack direction="row" justifyContent="center" pt={1}>
              <Stack spacing={1.5} alignItems="center">
                {showLookupStatus ? (
                  <Alert
                    severity={matchedAttendees.length > 0 ? "success" : "error"}
                    sx={{ width: "100%" }}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      {matchedAttendees.length > 0
                        ? "Found a match, ready to check in."
                        : "No matches found yet"}
                    </Typography>
                  </Alert>
                ) : null}
                <Stack direction="row" spacing={2}>
                  {canWalkIn ? (
                    <Button
                      variant="outlined"
                      onClick={() => navigate(signupUrl)}
                    >
                      Register
                    </Button>
                  ) : null}
                  <Button
                    variant="contained"
                    onClick={() => void handleSubmit()}
                    disabled={!canCheckIn}
                  >
                    Check in
                  </Button>
                </Stack>
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </Paper>
      <MeetSelfCheckinMatchDialog
        open={matchCandidates.length > 0}
        attendees={matchCandidates}
        onSelect={(attendee) => void handleMatchSelection(attendee)}
        onClose={() => setMatchCandidates([])}
      />
    </Container>
  );
}

export default MeetSelfCheckinPage;
