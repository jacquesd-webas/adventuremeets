import {
  Box,
  Container,
  Paper,
  Stack,
  Typography,
  FormControlLabel,
  Switch,
  Button,
  TextField,
  MenuItem,
  Alert,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { MeetNotFound } from "../components/MeetNotFound";
import { MeetStatus } from "../constants/meetStatus";
import { useFetchMeetSignup } from "../hooks/useFetchMeetSignup";
import { useAddAttendee } from "../hooks/useAddAttendee";
import { useCheckMeetAttendee } from "../hooks/useCheckMeetAttendee";
import { useApi } from "../hooks/useApi";
import { MeetSignupDuplicateDialog } from "../components/MeetSignupDuplicateDialog";
import { MeetSignupSubmitted } from "../components/MeetSignupSubmitted";
import { useMeetSignupSheetState } from "./MeetSignupSheetState";
import { getLocaleDefaults } from "../helpers/locale";
import {
  InternationalPhoneField,
  buildInternationalPhone,
  getDefaultPhoneCountry,
} from "../components/InternationalPhoneField";
import { EmailField } from "../components/EmailField";
import { MeetInfoSummary } from "../components/MeetInfoSummary";
import { NameField } from "../components/NameField";
import { PreviewBanner } from "../components/PreviewBanner";
import { formatFriendlyTimestamp } from "../helpers/formatFriendlyTimestamp";

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
  wantsGuests: boolean;
  guestCount: number;
  metaValues: Record<string, any>;
  indemnityAccepted: boolean;
  isSubmitDisabled: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
  onCheckDuplicate: () => void;
  setField: (key: string, value: any) => void;
  setMetaValue: (key: string, value: any) => void;
  setPhoneCountry: (value: string) => void;
  setPhoneLocal: (value: string) => void;
};

function MeetStatusAlert({
  statusId,
  openingDate,
}: {
  statusId?: number;
  openingDate?: string;
}) {
  let text = "";
  let severity: "info" | "warning" | "error" = "info";
  if (statusId === MeetStatus.Published) {
    const openLabel = openingDate ? formatFriendlyTimestamp(openingDate) : "";
    text = openLabel
      ? `This meet is not yet open for bookings. Booking opens ${openLabel}.`
      : "This meet is not yet open for bookings.";
    severity = "warning";
  } else if (statusId === MeetStatus.Closed) {
    text = "This meet is closed and no longer accepting bookings.";
    severity = "warning";
  } else if (statusId === MeetStatus.Cancelled) {
    text = "This meet has been cancelled.";
    severity = "error";
  } else if (statusId === MeetStatus.Postponed) {
    text = "This meet has been postponed. Please check back later for updates.";
    severity = "warning";
  } else if (statusId === MeetStatus.Completed) {
    text = "This meet has been archived and is no longer accepting bookings.";
    severity = "info";
  } else {
    return null;
  }

  return (
    <Box p={5}>
      <Alert
        severity={severity}
        icon={false}
        sx={{
          py: 6,
          fontWeight: 700,
          textAlign: "center",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {text}
      </Alert>
    </Box>
  );
}

function MeetSignupFormFields({
  meet,
  fullName,
  email,
  phoneCountry,
  phoneLocal,
  wantsGuests,
  guestCount,
  metaValues,
  indemnityAccepted,
  isSubmitDisabled,
  isSubmitting,
  onSubmit,
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
        />
      </LabeledField>
      <LabeledField label="Email" required>
        <EmailField
          required
          value={email}
          onChange={(value) => setField("email", value)}
          onBlur={onCheckDuplicate}
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
                  )
                )}
              </TextField>
            </LabeledField>
          )}
        </Stack>
      )}
      {(meet.metaDefinitions || []).map((field: any) => {
        const key = field.field_key;
        const value = metaValues[key];

        if (field.field_type === "checkbox" || field.field_type === "switch") {
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

        if (field.field_type === "select") {
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
              type={field.field_type === "number" ? "number" : "text"}
              value={
                typeof value === "number" || typeof value === "string"
                  ? value
                  : ""
              }
              onChange={(e) =>
                setMetaValue(
                  key,
                  field.field_type === "number" && e.target.value !== ""
                    ? Number(e.target.value)
                    : e.target.value
                )
              }
              fullWidth
            />
          </LabeledField>
        );
      })}
      {meet.requiresIndemnity && (
        <Stack spacing={1} mt={2}>
          <Alert
            severity="warning"
            icon={false}
            sx={{ whiteSpace: "pre-line" }}
          >
            {meet.indemnityText || "Indemnity details not provided."}
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
      <Stack direction="row" justifyContent="center" pt={2}>
        <Button
          variant="contained"
          disabled={isSubmitting || isSubmitDisabled}
          onClick={onSubmit}
        >
          Submit application
        </Button>
      </Stack>
    </Stack>
  );
}

function MeetSignupSheet() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "true";
  const { data: meet, isLoading } = useFetchMeetSignup(code);
  const { state, setField, setMetaValue } = useMeetSignupSheetState();
  const { addAttendeeAsync, isLoading: isSubmitting } = useAddAttendee();
  const { checkAttendeeAsync } = useCheckMeetAttendee();
  const api = useApi();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [submitted, setSubmitted] = useState(false);
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
  const {
    indemnityAccepted,
    fullName,
    email,
    wantsGuests,
    guestCount,
    metaValues,
  } = state;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const isOpenMeet = meet?.statusId === MeetStatus.Open;
  const shareLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/meets/${code}`
      : "";

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
          <MeetSignupSubmitted />
        </Box>
      </Box>
    );
  }

  const requiredMetaMissing = (meet?.metaDefinitions || []).some((field) => {
    if (!field.required) return false;
    const key = field.field_key;
    const value = metaValues[key];
    if (field.field_type === "checkbox" || field.field_type === "switch") {
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
    (meet?.requiresIndemnity && !indemnityAccepted);

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

  const handleSubmit = async () => {
    if (!meet) return;
    if (isPreview) {
      setSubmitted(true);
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
    const metaPayload = (meet.metaDefinitions || [])
      .map((field) => {
        const key = field.field_key;
        const value = metaValues[key];
        if (value === undefined || value === null || value === "") {
          return null;
        }
        return { definitionId: field.id, value: String(value) };
      })
      .filter((value): value is { definitionId: string; value: string } =>
        Boolean(value)
      );
    await addAttendeeAsync({
      meetId: meet.id,
      name: fullName,
      email,
      phone: fullPhone,
      guests: wantsGuests ? guestCount : 0,
      indemnityAccepted: indemnityAccepted,
      indemnityMinors: "",
      metaValues: metaPayload,
    });
    setSubmitted(true);
  };

  const handleUpdate = async () => {
    if (!meet || !existingAttendee) return;
    const fullPhone = buildInternationalPhone(phoneCountry, phoneLocal);
    await api.patch(`/meets/${meet.id}/attendees/${existingAttendee.id}`, {
      name: fullName,
      email,
      phone: fullPhone,
      guests: wantsGuests ? guestCount : 0,
      indemnityAccepted: indemnityAccepted,
      indemnityMinors: "",
    });
    setShowDuplicateModal(false);
    setSubmitted(true);
  };

  const handleRemove = async () => {
    if (!meet || !existingAttendee) return;
    await api.del(`/meets/${meet.id}/attendees/${existingAttendee.id}`);
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
                shareLink={shareLink}
                onCopyLink={async () => {
                  if (!shareLink) return;
                  try {
                    await navigator.clipboard.writeText(shareLink);
                  } catch (err) {
                    console.error("Failed to copy share link", err);
                  }
                }}
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
                  wantsGuests={wantsGuests}
                  guestCount={guestCount}
                  metaValues={metaValues}
                  indemnityAccepted={indemnityAccepted}
                  isSubmitDisabled={isSubmitDisabled}
                  isSubmitting={isSubmitting}
                  onSubmit={handleSubmit}
                  onCheckDuplicate={checkForDuplicate}
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
      </Container>
    </Box>
  );
}

export default MeetSignupSheet;
