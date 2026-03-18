import {
  Box,
  Chip,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { MeetNotFound } from "../components/meet/MeetNotFound";
import { MeetStatusEnum } from "../types/MeetStatusEnum";
import { useFetchMeetSignup } from "../hooks/useFetchMeetSignup";
import { useAddAttendee } from "../hooks/useAddAttendee";
import { useCheckMeetAttendee } from "../hooks/useCheckMeetAttendee";
import { useApi } from "../hooks/useApi";
import { MeetSignupDuplicateDialog } from "../components/meet/MeetSignupDuplicateDialog";
import { MeetSignupSubmitted } from "../components/meet/MeetSignupSubmitted";
import { useMeetSignupSheetState } from "./MeetSignupSheetState";
import { getLocaleDefaults } from "../helpers/locale";
import {
  buildInternationalPhone,
  getDefaultPhoneCountry,
  splitInternationalPhone,
} from "../components/formFields/InternationalPhoneField";
import { MeetInfoSummary } from "../components/meet/MeetInfoSummary";
import { PreviewBanner } from "../components/meet/PreviewBanner";
import { LoginForm } from "../components/auth/LoginForm";
import { MeetStatusAlert } from "../components/meet/MeetStatusAlert";
import { useAuth } from "../context/authContext";
import { useFetchUserMetaValues } from "../hooks/useFetchUserMetaValues";
import { MeetSignupUserAction } from "../components/meet/MeetSignupUserAction";
import { useFetchOrganization } from "../hooks/useFetchOrganization";
import { useThemeMode } from "../context/ThemeModeContext";
import { getOrganizationBackground } from "../helpers/organizationTheme";
import { useFetchMeetAttendeeEdit } from "../hooks/useFetchMeetAttendeeEdit";
import { useQueryClient } from "@tanstack/react-query";
import {
  validateEmail,
  validatePhone,
  validateRequired,
} from "../helpers/validation";
import { MeetSignupFormFields } from "../components/meetSignup/MeetSignupFormFields";

function MeetSignupSheet() {
  const { code, attendeeId: attendeeIdParam } = useParams<{
    code: string;
    attendeeId?: string;
  }>();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "true";
  const guestOf = searchParams.get("guestOf");
  const action = searchParams.get("action");
  const editAttendeeId = attendeeIdParam || searchParams.get("attendeeId");
  const isEditing =
    Boolean(editAttendeeId) &&
    (action === "edit" || searchParams.has("attendeeId"));
  const { data: meet, isLoading } = useFetchMeetSignup(code);
  const { attendee: editAttendee, refetch: refetchEditAttendee } =
    useFetchMeetAttendeeEdit(
      isEditing ? code : null,
      isEditing ? editAttendeeId : null,
    );
  const { data: organization } = useFetchOrganization(
    meet?.organizationId || undefined,
  );
  const { state, setField, setMetaValue, resetState } =
    useMeetSignupSheetState();
  const { addAttendeeAsync, isLoading: isSubmitting } = useAddAttendee();
  const { checkAttendeeAsync } = useCheckMeetAttendee();
  const api = useApi();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { mode } = useThemeMode();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const mobilePreviewTopOffset = "var(--preview-banner-height, 0px)";
  const suppressAutofillRef = useRef(false);
  const metaAutofillRef = useRef(false);
  const editPrefillRef = useRef(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedAttendeeId, setSubmittedAttendeeId] = useState<string | null>(
    null,
  );
  const [existingAttendee, setExistingAttendee] = useState<{
    id: string;
  } | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState(() => {
    const localeCountry = getLocaleDefaults().countryCode;
    return getDefaultPhoneCountry(localeCountry);
  });
  const [phoneLocal, setPhoneLocal] = useState("");
  const [lastCheckedContact, setLastCheckedContact] = useState<{
    email: string;
    phone: string;
  } | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const {
    indemnityAccepted,
    fullName,
    email,
    wantsGuests,
    guests,
    metaValues,
    guardianName,
    isMinor,
  } = state;
  const disableIdentityFields = Boolean(isAuthenticated);
  const disablePhone = false;
  const disableGuests = Boolean(guestOf);

  const { data: userMetaValues, isLoading: userMetaLoading } =
    useFetchUserMetaValues(user?.id, meet?.organizationId);

  const loggedInName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.idp_profile?.name ||
      ""
    : "";

  // Automatically populate fields if user is logged in (minor name can be different though)
  useEffect(() => {
    if (!user || !isAuthenticated) return;
    if (suppressAutofillRef.current) return;
    if (loggedInName && !isMinor) {
      setField("fullName", loggedInName);
    }
    if (user.email) {
      setField("email", user.email);
    }
    if (user.phone) {
      const parsed = splitInternationalPhone(user.phone);
      setPhoneCountry(parsed.country);
      setPhoneLocal(parsed.local);
      setField("phone", buildInternationalPhone(parsed.country, parsed.local));
    }
  }, [
    isAuthenticated,
    user,
    setField,
    setPhoneCountry,
    setPhoneLocal,
    isMinor,
    loggedInName,
  ]);

  // Auto-fill questions based on users profile
  useEffect(() => {
    if (!isAuthenticated || !meet || userMetaLoading) return;
    if (metaAutofillRef.current) return;
    if (!userMetaValues.length) {
      metaAutofillRef.current = true;
      return;
    }
    const byKey = new Map(userMetaValues.map((item) => [item.key, item.value]));
    (meet.metaDefinitions || []).forEach((field: any) => {
      const key = field.fieldKey;
      const existingValue = metaValues[key];
      if (
        existingValue !== undefined &&
        existingValue !== null &&
        existingValue !== ""
      ) {
        return;
      }
      const raw = byKey.get(key);
      if (raw === undefined) return;
      if (field.fieldType === "checkbox" || field.fieldType === "switch") {
        setMetaValue(key, raw === "true");
        return;
      }
      if (field.fieldType === "number") {
        const parsed = Number(raw);
        if (!Number.isNaN(parsed)) {
          setMetaValue(key, parsed);
        }
        return;
      }
      setMetaValue(key, raw);
    });
    metaAutofillRef.current = true;
  }, [
    isAuthenticated,
    meet,
    metaValues,
    setMetaValue,
    userMetaLoading,
    userMetaValues,
  ]);

  // Suppress auto-filling when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      suppressAutofillRef.current = false;
      metaAutofillRef.current = false;
    }
  }, [isAuthenticated]);

  // Edit mode - pre-fill form with existing attendee data
  useEffect(() => {
    if (!editAttendee || editPrefillRef.current) return;
    if (!meet) return;
    editPrefillRef.current = true;
    suppressAutofillRef.current = true;
    metaAutofillRef.current = true;
    setExistingAttendee({ id: editAttendee.id });
    setLastCheckedContact({
      email: editAttendee.email ?? "",
      phone: editAttendee.phone ?? "",
    });
    if (editAttendee.name) {
      setField("fullName", editAttendee.name);
    }
    if (editAttendee.email) {
      setField("email", editAttendee.email);
    }
    if (editAttendee.phone) {
      const parsed = splitInternationalPhone(editAttendee.phone);
      setPhoneCountry(parsed.country);
      setPhoneLocal(parsed.local);
      setField("phone", buildInternationalPhone(parsed.country, parsed.local));
    }
    const guestsCount = Number(editAttendee.guests || 0);
    setField("wantsGuests", guestsCount > 0);
    setField(
      "guests",
      Array.from({ length: Math.max(0, guestsCount) }, () => ({
        name: "",
        isMinor: false,
      })),
    );
    if (editAttendee.indemnityAccepted !== undefined) {
      setField("indemnityAccepted", Boolean(editAttendee.indemnityAccepted));
    }
    if (editAttendee.isMinor !== undefined && editAttendee.isMinor !== null) {
      setField("isMinor", Boolean(editAttendee.isMinor));
    }
    if (editAttendee.guardianName) {
      setField("guardianName", editAttendee.guardianName);
    }
    const valuesByKey = new Map(
      (editAttendee.metaValues || []).map((item) => [
        item.fieldKey,
        item.value,
      ]),
    );
    (meet.metaDefinitions || []).forEach((field: any) => {
      const raw = valuesByKey.get(field.fieldKey);
      if (raw === undefined || raw === null) return;
      if (field.fieldType === "checkbox" || field.fieldType === "switch") {
        setMetaValue(field.fieldKey, raw === "true");
        return;
      }
      if (field.fieldType === "number") {
        const parsed = Number(raw);
        if (!Number.isNaN(parsed)) {
          setMetaValue(field.fieldKey, parsed);
        }
        return;
      }
      setMetaValue(field.fieldKey, raw);
    });
  }, [
    editAttendee,
    meet,
    setField,
    setMetaValue,
    setPhoneCountry,
    setPhoneLocal,
  ]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Set organization-specific background and theme, and clean up on unmount
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

  // Switch name and guardian fields if the user is a minor and user is logged in
  useEffect(() => {
    if (disableIdentityFields && isMinor) {
      console.log({ loggedInName, guardianName, fullName });
      if (loggedInName && loggedInName !== guardianName) {
        setField("guardianName", loggedInName);
        setField("fullName", "");
        setNameError("");
      }
    }
  }, [
    isMinor,
    disableIdentityFields,
    loggedInName,
    setField,
    setNameError,
    guardianName,
    fullName,
  ]);

  const handleLogout = () => {
    suppressAutofillRef.current = true;
    resetState();
    const localeCountry = getLocaleDefaults().countryCode;
    setPhoneCountry(getDefaultPhoneCountry(localeCountry));
    setPhoneLocal("");
    setField("fullName", "");
    setField("email", "");
    setField("phone", "");
    setLastCheckedContact(null);
    setExistingAttendee(null);
    setShowDuplicateModal(false);
    setSubmitted(false);
    setSubmittedAttendeeId(null);
  };

  const isOpenMeet = meet?.statusId === MeetStatusEnum.Open;

  if (!isLoading && !meet) {
    return <MeetNotFound />;
  }

  if (submitted) {
    return (
      <Box sx={{ height: "100vh", position: "relative" }}>
        {isPreview ? (
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 2,
              bgcolor: "warning.light",
              px: 2,
              py: 1.5,
              boxShadow: 1,
            }}
          >
            <Typography
              variant="body2"
              align="center"
              color="text.primary"
              fontWeight={600}
            >
              PREVIEW ONLY - No changes were saved on this form
            </Typography>
          </Box>
        ) : null}
        <Box
          sx={{ pt: isPreview ? (isMobile ? mobilePreviewTopOffset : 10) : 0 }}
        >
          <MeetSignupSubmitted
            firstName={fullName.trim().split(/\s+/)[0] || ""}
            lastName={fullName.trim().split(/\s+/).slice(1).join(" ") || ""}
            email={email}
            phoneCountry={phoneCountry}
            phoneLocal={phoneLocal}
            organizationId={meet?.organizationId}
            meetId={meet?.id}
            attendeeId={submittedAttendeeId || undefined}
            shareCode={code}
            guests={guests}
            isOrganizationPrivate={organization?.isPrivate}
            isPreview={isPreview}
          />
        </Box>
      </Box>
    );
  }

  const requiredMetaMissing = (meet?.metaDefinitions || []).some((field) => {
    if (!field.required) return false;
    const key = field.fieldKey;
    const value = metaValues[key];
    if (field.fieldType === "checkbox" || field.fieldType === "switch") {
      return value !== true;
    }
    return value === undefined || value === null || value === "";
  });

  const isSubmitDisabled =
    !isOpenMeet ||
    !fullName.trim() ||
    !email.trim() ||
    !phoneLocal.trim() ||
    Boolean(nameError) ||
    Boolean(emailError) ||
    Boolean(phoneError) ||
    requiredMetaMissing ||
    (meet?.hasIndemnity && !indemnityAccepted);

  const handleNameBlur = () => {
    setNameError(validateRequired(fullName, "Name"));
  };

  const handleEmailBlur = () => {
    const formatError = validateEmail(email);
    setEmailError(formatError);
    if (!formatError && !isMinor) {
      checkForDuplicate();
    }
  };

  const handlePhoneBlur = () => {
    const error = validatePhone(phoneLocal);
    setPhoneError(error);
    if (!error) {
      checkForDuplicate();
    }
  };

  const checkForDuplicate = async () => {
    if (!meet) return;
    if (isEditing) return;
    const trimmedEmail = isMinor ? "" : email.trim();
    const trimmedPhone = buildInternationalPhone(phoneCountry, phoneLocal);
    if (!trimmedEmail && !trimmedPhone) return;
    if (
      lastCheckedContact &&
      lastCheckedContact.email === trimmedEmail &&
      lastCheckedContact.phone === trimmedPhone
    ) {
      return;
    }
    const check = await checkAttendeeAsync({
      meetId: meet.id,
      email: trimmedEmail,
      phone: trimmedPhone,
    });
    setLastCheckedContact({ email: trimmedEmail, phone: trimmedPhone });
    if (check.attendee) {
      setExistingAttendee({ id: check.attendee.id });
      setShowDuplicateModal(true);
    }
  };

  const buildMetaPayload = () =>
    (meet?.metaDefinitions || [])
      .map((field) => {
        const key = field.fieldKey;
        const value = metaValues[key];
        if (value === undefined || value === null || value === "") {
          return null;
        }
        return { definitionId: field.id, value: String(value) };
      })
      .filter((value): value is { definitionId: string; value: string } =>
        Boolean(value),
      );

  const handleSubmit = async () => {
    if (!meet) return;
    if (isPreview) {
      setSubmitted(true);
      return;
    }
    if (isEditing && existingAttendee) {
      await handleUpdate();
      return;
    }
    const fullPhone = buildInternationalPhone(phoneCountry, phoneLocal);
    if (!isEditing) {
      const trimmedEmail = isMinor ? "" : email.trim();
      const check = await checkAttendeeAsync({
        meetId: meet.id,
        email: trimmedEmail || undefined,
        phone: fullPhone,
      });
      if (check.attendee) {
        setExistingAttendee({ id: check.attendee.id });
        setShowDuplicateModal(true);
        return;
      }
    }
    const metaPayload = buildMetaPayload();
    const res = await addAttendeeAsync({
      meetId: meet.id,
      name: fullName,
      email,
      phone: fullPhone,
      guestOf: guestOf || undefined,
      isMinor: isMinor,
      GuardianName: isMinor ? guardianName || undefined : undefined,
      guests: wantsGuests ? guests.length : 0,
      guestsList: wantsGuests ? guests : [],
      indemnityAccepted: indemnityAccepted,
      indemnityMinors: "",
      metaValues: metaPayload,
    });
    setSubmittedAttendeeId(res?.attendee?.id ?? null);
    setSubmitted(true);
  };

  const handleUpdate = async () => {
    if (!meet || !existingAttendee) return;
    const fullPhone = buildInternationalPhone(phoneCountry, phoneLocal);
    const metaPayload = buildMetaPayload();
    const payload = {
      name: fullName,
      email,
      phone: fullPhone,
      isMinor: isMinor,
      GuardianName: isMinor ? guardianName || undefined : undefined,
      guests: wantsGuests ? guests.length : 0,
      guestsList: wantsGuests ? guests : [],
      indemnityAccepted: indemnityAccepted,
      indemnityMinors: "",
      metaValues: metaPayload,
    };
    if (editAttendeeId && code) {
      // TODO: move this to hook
      await api.patch(`/meets/${code}/attendee/${existingAttendee.id}`, {
        ...payload,
      });
      await queryClient.invalidateQueries({
        queryKey: ["attendee-edit", editAttendeeId],
      });
    } else {
      await api.patch(
        `/meets/${meet.id}/attendees/${existingAttendee.id}`,
        payload,
      );
    }
    if (editAttendeeId) {
      refetchEditAttendee();
    }
    setSubmittedAttendeeId(existingAttendee.id);
    setShowDuplicateModal(false);
    setSubmitted(true);
  };

  const handleCancelEdit = () => {
    if (!code || !editAttendeeId) return;
    window.location.href = `/meets/${code}/${editAttendeeId}`;
  };

  const handleRemove = async () => {
    if (!meet || !existingAttendee) return;
    await api.del(`/meets/${meet.id}/attendees/${existingAttendee.id}`);
    setSubmittedAttendeeId(null);
    setShowDuplicateModal(false);
    setSubmitted(true);
  };

  return (
    <Box sx={{ height: "100vh", position: "relative" }}>
      {isPreview ? <PreviewBanner /> : null}
      <Container
        maxWidth={isMobile ? false : "md"}
        disableGutters={isMobile}
        sx={{
          py: isMobile ? 0 : 6,
          pt: isPreview
            ? isMobile
              ? mobilePreviewTopOffset
              : 6
            : isMobile
              ? 0
              : 6,
          minHeight: "100vh",
          height: "100%",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            p: isMobile ? 2 : 3,
            minHeight: "100%",
            borderRadius: isMobile ? 0 : 2,
            boxShadow: isMobile ? "none" : undefined,
          }}
        >
          {isLoading ? (
            <Typography color="text.secondary">Loading meet...</Typography>
          ) : (
            <Stack spacing={1.5}>
              <MeetInfoSummary
                meet={meet}
                isPreview={isPreview}
                actionSlot={
                  guestOf ? (
                    <Chip label="Guest" size="small" color="info" />
                  ) : (
                    <MeetSignupUserAction
                      formEmail={undefined}
                      onLogout={handleLogout}
                    />
                  )
                }
              />
              {!isPreview && (
                <MeetStatusAlert
                  statusId={meet.statusId}
                  openingDate={meet.openingDate}
                />
              )}
              {(isOpenMeet || isPreview) && (
                <MeetSignupFormFields
                  meet={meet}
                  fullName={fullName}
                  email={email}
                  phoneCountry={phoneCountry}
                  phoneLocal={phoneLocal}
                  nameError={nameError}
                  emailError={emailError}
                  phoneError={phoneError}
                  disableIdentityFields={disableIdentityFields}
                  disablePhone={disablePhone}
                  disableGuests={disableGuests}
                  guestOf={guestOf}
                  guardianName={guardianName}
                  wantsGuests={wantsGuests}
                  guests={guests}
                  metaValues={metaValues}
                  indemnityAccepted={indemnityAccepted}
                  isMinor={isMinor}
                  isSubmitDisabled={isSubmitDisabled}
                  isSubmitting={isSubmitting}
                  isEditing={isEditing}
                  onSubmit={handleSubmit}
                  onCancelEdit={handleCancelEdit}
                  onCheckDuplicate={
                    isEditing ? () => undefined : checkForDuplicate
                  }
                  onNameBlur={handleNameBlur}
                  onEmailBlur={handleEmailBlur}
                  onPhoneBlur={handlePhoneBlur}
                  setField={setField}
                  setMetaValue={setMetaValue}
                  setPhoneCountry={setPhoneCountry}
                  setPhoneLocal={setPhoneLocal}
                />
              )}
            </Stack>
          )}
        </Paper>
        <MeetSignupDuplicateDialog
          open={showDuplicateModal}
          onClose={() => setShowDuplicateModal(false)}
          onRemove={handleRemove}
          onUpdate={handleUpdate}
        />
        <Dialog
          open={loginOpen}
          onClose={() => setLoginOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Login</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <LoginForm
              onSuccess={() => setLoginOpen(false)}
              submitLabel="Login"
            />
          </DialogContent>
        </Dialog>
      </Container>
    </Box>
  );
}

export default MeetSignupSheet;
