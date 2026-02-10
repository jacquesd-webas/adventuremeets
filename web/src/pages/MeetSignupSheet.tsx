import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
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
  InternationalPhoneField,
  buildInternationalPhone,
  getDefaultPhoneCountry,
  splitInternationalPhone,
} from "../components/formFields/InternationalPhoneField";
import { EmailField } from "../components/formFields/EmailField";
import { MeetInfoSummary } from "../components/meet/MeetInfoSummary";
import { NameField } from "../components/formFields/NameField";
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

function LabeledField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="subtitle2" fontWeight={700}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </Typography>
      {children}
    </Stack>
  );
}

type MeetSignupFormProps = {
  meet: any;
  fullName: string;
  email: string;
  phoneCountry: string;
  phoneLocal: string;
  disableIdentityFields: boolean;
  disablePhone: boolean;
  wantsGuests: boolean;
  guestCount: number;
  metaValues: Record<string, any>;
  indemnityAccepted: boolean;
  isSubmitDisabled: boolean;
  isSubmitting: boolean;
  isEditing: boolean;
  onSubmit: () => void;
  onCancelEdit?: () => void;
  onCheckDuplicate: () => void;
  setField: (key: string, value: any) => void;
  setMetaValue: (key: string, value: any) => void;
  setPhoneCountry: (value: string) => void;
  setPhoneLocal: (value: string) => void;
};

function MeetSignupFormFields({
  meet,
  fullName,
  email,
  phoneCountry,
  phoneLocal,
  disableIdentityFields,
  disablePhone,
  wantsGuests,
  guestCount,
  metaValues,
  indemnityAccepted,
  isSubmitDisabled,
  isSubmitting,
  isEditing,
  onSubmit,
  onCancelEdit,
  onCheckDuplicate,
  setField,
  setMetaValue,
  setPhoneCountry,
  setPhoneLocal,
}: MeetSignupFormProps) {
  return (
    <Stack spacing={2} mt={2}>
      <LabeledField label="Name" required>
        <NameField
          required
          value={fullName}
          onChange={(value) => setField("fullName", value)}
          disabled={disableIdentityFields}
        />
      </LabeledField>
      <LabeledField label="Email" required>
        <EmailField
          required
          value={email}
          onChange={(value) => setField("email", value)}
          onBlur={onCheckDuplicate}
          disabled={disableIdentityFields}
        />
      </LabeledField>
      <LabeledField label="Phone" required>
        <InternationalPhoneField
          required
          country={phoneCountry}
          local={phoneLocal}
          onCountryChange={(value) => {
            setPhoneCountry(value);
            setField("phone", buildInternationalPhone(value, phoneLocal));
          }}
          onLocalChange={(value) => {
            setPhoneLocal(value);
            setField("phone", buildInternationalPhone(phoneCountry, value));
          }}
          onBlur={onCheckDuplicate}
          disabled={disablePhone}
        />
      </LabeledField>
      {meet.allowGuests && (
        <Stack spacing={1}>
          <FormControlLabel
            control={
              <Switch
                checked={wantsGuests}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setField("wantsGuests", checked);
                  if (!checked) {
                    setField("guestCount", 0);
                  }
                }}
              />
            }
            label="I would like to bring guests"
          />
          {wantsGuests && (
            <LabeledField label="Number of guests" required>
              <TextField
                select
                value={guestCount}
                onChange={(e) => setField("guestCount", Number(e.target.value))}
                fullWidth
              >
                {Array.from(
                  {
                    length: Math.max(0, Number(meet.maxGuests || 0)) + 1,
                  },
                  (_, idx) => (
                    <MenuItem key={idx} value={idx}>
                      {idx}
                    </MenuItem>
                  ),
                )}
              </TextField>
            </LabeledField>
          )}
        </Stack>
      )}
      {(meet.metaDefinitions || []).map((field: any) => {
        const key = field.fieldKey;
        const value = metaValues[key];

        if (field.fieldType === "checkbox" || field.fieldType === "switch") {
          return (
            <FormControlLabel
              key={field.id}
              control={
                <Switch
                  checked={Boolean(value)}
                  onChange={(e) => setMetaValue(key, e.target.checked)}
                />
              }
              label={`${field.label}${field.required ? " *" : ""}`}
            />
          );
        }

        if (field.fieldType === "select") {
          const options = Array.isArray(field.config?.options)
            ? field.config.options
            : [];
          return (
            <LabeledField
              key={field.id}
              label={field.label}
              required={field.required}
            >
              <TextField
                select
                value={typeof value === "string" ? value : ""}
                onChange={(e) => setMetaValue(key, e.target.value)}
                fullWidth
              >
                <MenuItem value="">Select an option</MenuItem>
                {options.map((option: string) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </LabeledField>
          );
        }

        return (
          <LabeledField
            key={field.id}
            label={field.label}
            required={field.required}
          >
            <TextField
              type={field.fieldType === "number" ? "number" : "text"}
              value={
                typeof value === "number" || typeof value === "string"
                  ? value
                  : ""
              }
              onChange={(e) =>
                setMetaValue(
                  key,
                  field.fieldType === "number" && e.target.value !== ""
                    ? Number(e.target.value)
                    : e.target.value,
                )
              }
              fullWidth
            />
          </LabeledField>
        );
      })}
      {meet.hasIndemnity && (
        <Stack spacing={1} mt={2}>
          <Alert
            severity="warning"
            icon={false}
            sx={{ whiteSpace: "pre-line" }}
          >
            {meet.indemnity || "Indemnity details not provided."}
          </Alert>
          <FormControlLabel
            control={
              <Switch
                checked={indemnityAccepted}
                onChange={(e) => {
                  setField("indemnityAccepted", e.target.checked);
                }}
              />
            }
            label="I accept the indemnity"
          />
        </Stack>
      )}
      <Stack direction="row" justifyContent="center" pt={2} spacing={2}>
        {isEditing ? (
          <>
            <Button variant="outlined" onClick={onCancelEdit}>
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={isSubmitting || isSubmitDisabled}
              onClick={onSubmit}
            >
              Update
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            disabled={isSubmitting || isSubmitDisabled}
            onClick={onSubmit}
          >
            Submit application
          </Button>
        )}
      </Stack>
    </Stack>
  );
}

function MeetSignupSheet() {
  const { code, attendeeId: attendeeIdParam } = useParams<{
    code: string;
    attendeeId?: string;
  }>();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "true";
  const action = searchParams.get("action");
  const editAttendeeId = attendeeIdParam || searchParams.get("attendeeId");
  const isEditing =
    Boolean(editAttendeeId) &&
    (action === "edit" || searchParams.has("attendeeId"));
  const { data: meet, isLoading } = useFetchMeetSignup(code);
  const { attendee: editAttendee } = useFetchMeetAttendeeEdit(
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
  const {
    indemnityAccepted,
    fullName,
    email,
    wantsGuests,
    guestCount,
    metaValues,
  } = state;
  const disableIdentityFields = Boolean(isAuthenticated);
  const disablePhone = false;

  const { data: userMetaValues, isLoading: userMetaLoading } =
    useFetchUserMetaValues(user?.id, meet?.organizationId);

  useEffect(() => {
    if (!user || !isAuthenticated) return;
    if (suppressAutofillRef.current) return;
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.idp_profile?.name ||
      "";
    if (name) {
      setField("fullName", name);
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
  }, [isAuthenticated, user, setField, setPhoneCountry, setPhoneLocal]);

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

  useEffect(() => {
    if (!isAuthenticated) {
      suppressAutofillRef.current = false;
      metaAutofillRef.current = false;
    }
  }, [isAuthenticated]);

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
    const guests = Number(editAttendee.guests || 0);
    setField("wantsGuests", guests > 0);
    setField("guestCount", guests);
    if (editAttendee.indemnityAccepted !== undefined) {
      setField("indemnityAccepted", Boolean(editAttendee.indemnityAccepted));
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

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

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
        <Box sx={{ pt: isPreview ? 10 : 0 }}>
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
    requiredMetaMissing ||
    (meet?.hasIndemnity && !indemnityAccepted);

  const checkForDuplicate = async () => {
    if (!meet) return;
    const trimmedEmail = email.trim();
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
    const check = await checkAttendeeAsync({
      meetId: meet.id,
      email,
      phone: fullPhone,
    });
    if (check.attendee) {
      setExistingAttendee({ id: check.attendee.id });
      setShowDuplicateModal(true);
      return;
    }
    const metaPayload = buildMetaPayload();
    const res = await addAttendeeAsync({
      meetId: meet.id,
      name: fullName,
      email,
      phone: fullPhone,
      guests: wantsGuests ? guestCount : 0,
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
      guests: wantsGuests ? guestCount : 0,
      indemnityAccepted: indemnityAccepted,
      indemnityMinors: "",
      metaValues: metaPayload,
    };
    if (editAttendeeId && code) {
      await api.patch(`/meets/${code}/attendee/${existingAttendee.id}`, {
        ...payload,
      });
      await queryClient.invalidateQueries({
        queryKey: ["attendee-edit", editAttendeeId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["attendee-status", editAttendeeId],
      });
    } else {
      await api.patch(
        `/meets/${meet.id}/attendees/${existingAttendee.id}`,
        payload,
      );
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
          pt: isPreview ? (isMobile ? 10 : 6) : isMobile ? 2 : 6,
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
                  <MeetSignupUserAction
                    formEmail={undefined}
                    onLogout={handleLogout}
                  />
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
                  disableIdentityFields={disableIdentityFields}
                  disablePhone={disablePhone}
                  wantsGuests={wantsGuests}
                  guestCount={guestCount}
                  metaValues={metaValues}
                  indemnityAccepted={indemnityAccepted}
                  isSubmitDisabled={isSubmitDisabled}
                  isSubmitting={isSubmitting}
                  isEditing={isEditing}
                  onSubmit={handleSubmit}
                  onCancelEdit={handleCancelEdit}
                  onCheckDuplicate={
                    isEditing ? () => undefined : checkForDuplicate
                  }
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
