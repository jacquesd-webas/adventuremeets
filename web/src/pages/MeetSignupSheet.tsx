import {
  Container,
  Paper,
  Stack,
  Typography,
  Chip,
  FormControlLabel,
  Switch,
  Button,
  TextField,
  MenuItem
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PlaceIcon from "@mui/icons-material/Place";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import { useParams } from "react-router-dom";
import { useState } from "react";
import { MeetNotFound } from "../components/MeetNotFound";
import { useFetchMeetSignup } from "../hooks/useFetchMeetSignup";
import { useAddAttendee } from "../hooks/useAddAttendee";
import { useCheckMeetAttendee } from "../hooks/useCheckMeetAttendee";
import { useApi } from "../hooks/useApi";
import { MeetSignupDuplicateDialog } from "../components/MeetSignupDuplicateDialog";
import { MeetSignupSubmitted } from "../components/MeetSignupSubmitted";
import { useMeetSignupSheetState } from "./MeetSignupSheetState";
import { getLocaleDefaults } from "../utils/locale";
import { InternationalPhoneField, buildInternationalPhone } from "../components/InternationalPhoneField";
import { EmailField } from "../components/EmailField";

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

function MeetSignupSheet() {
  const { code } = useParams<{ code: string }>();
  const { data: meet, isLoading } = useFetchMeetSignup(code);
  const { state, setField, setMetaValue } = useMeetSignupSheetState();
  const { addAttendeeAsync, isLoading: isSubmitting } = useAddAttendee();
  const { checkAttendeeAsync } = useCheckMeetAttendee();
  const api = useApi();
  const [submitted, setSubmitted] = useState(false);
  const [existingAttendee, setExistingAttendee] = useState<{
    id: string;
  } | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState(() => {
    const localeCountry = getLocaleDefaults().countryCode;
    return phoneCountryOptions.some((option) => option.code === localeCountry) ? localeCountry : "ZA";
  });
  const [phoneLocal, setPhoneLocal] = useState("");
  const [lastCheckedContact, setLastCheckedContact] = useState<{ email: string; phone: string } | null>(null);
  const {
    indemnityAccepted,
    showIndemnity,
    fullName,
    email,
    wantsGuests,
    guestCount,
    metaValues,
  } = state;

  const startDate = meet ? new Date(meet.start) : null;
  const endDate = meet ? new Date(meet.end) : null;

  const dateLabel =
    startDate &&
    new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(startDate);

  const startTimeLabel =
    startDate &&
    startDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const durationLabel =
    startDate && endDate
      ? (() => {
          const diffMs = endDate.getTime() - startDate.getTime();
          const totalMinutes = Math.max(0, Math.round(diffMs / 60000));
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
        })()
      : null;

  if (!isLoading && !meet) {
    return <MeetNotFound />;
  }

  if (submitted) {
    return <MeetSignupSubmitted />;
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
    if (lastCheckedContact && lastCheckedContact.email === trimmedEmail && lastCheckedContact.phone === trimmedPhone) {
      return;
    }
    const check = await checkAttendeeAsync({ meetId: meet.id, email: trimmedEmail, phone: trimmedPhone });
    setLastCheckedContact({ email: trimmedEmail, phone: trimmedPhone });
    if (check.attendee) {
      setExistingAttendee({ id: check.attendee.id });
      setShowDuplicateModal(true);
    }
  };

  const handleSubmit = async () => {
    if (!meet) return;
    const fullPhone = buildInternationalPhone(phoneCountry, phoneLocal);
    const check = await checkAttendeeAsync({ meetId: meet.id, email, phone: fullPhone });
    if (check.attendee) {
      setExistingAttendee({ id: check.attendee.id });
      setShowDuplicateModal(true);
      return;
    }
    await addAttendeeAsync({
      meetId: meet.id,
      name: fullName,
      email,
      phone: fullPhone,
      guests: wantsGuests ? guestCount : 0,
      indemnityAccepted: indemnityAccepted,
      indemnityMinors: "",
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
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        {isLoading ? (
          <Typography color="text.secondary">Loading meet...</Typography>
        ) : (
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h4" fontWeight={700}>
                {meet.name}
              </Typography>
              <Chip label={meet.status} color="primary" />
            </Stack>
            {dateLabel && (
              <Typography variant="subtitle1" color="text.secondary">
                {dateLabel}
              </Typography>
            )}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems="center"
              justifyContent="flex-start"
              flexWrap="wrap"
              mt={1}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonOutlineIcon fontSize="small" color="disabled" />
                <Typography variant="body2">{meet.organizerName}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <AccessTimeIcon fontSize="small" color="disabled" />
                <Typography variant="body2">
                  {startTimeLabel} ({durationLabel || "Duration TBD"})
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <PlaceIcon fontSize="small" color="disabled" />
                <Typography variant="body2">{meet.location}</Typography>
              </Stack>
            </Stack>
            <Typography variant="body1" color="text.secondary">
              {meet.description}
            </Typography>
            <Stack spacing={2} mt={2}>
              <LabeledField label="Full name" required>
                <TextField
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setField("fullName", e.target.value)}
                  fullWidth
                />
              </LabeledField>
              <LabeledField label="Email" required>
                <EmailField
                  required
                  value={email}
                  onChange={(value) => setField("email", value)}
                  onBlur={checkForDuplicate}
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
                  onBlur={checkForDuplicate}
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
                        onChange={(e) =>
                          setField("guestCount", Number(e.target.value))
                        }
                        fullWidth
                      >
                        {Array.from(
                          {
                            length:
                              Math.max(0, Number(meet.maxGuests || 0)) + 1,
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
              {(meet.metaDefinitions || []).map((field) => {
                const key = field.field_key;
                const value = metaValues[key];

                if (
                  field.field_type === "checkbox" ||
                  field.field_type === "switch"
                ) {
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
            </Stack>
            {meet.requiresIndemnity && (
              <Stack spacing={1} mt={2}>
                {!indemnityAccepted && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ whiteSpace: "pre-line" }}
                  >
                    {meet.indemnityText}
                  </Typography>
                )}
                <FormControlLabel
                  control={
                    <Switch
                      checked={indemnityAccepted}
                      onChange={(e) => {
                        setField("indemnityAccepted", e.target.checked);
                        if (e.target.checked) {
                          setField("showIndemnity", false);
                        }
                      }}
                    />
                  }
                  label="I accept the indemnity"
                />
                {indemnityAccepted && (
                  <Button
                    size="small"
                    variant={showIndemnity ? "contained" : "outlined"}
                    onClick={() => setField("showIndemnity", !showIndemnity)}
                    sx={{ alignSelf: "flex-start" }}
                  >
                    {showIndemnity ? "Hide indemnity" : "View indemnity"}
                  </Button>
                )}
                {indemnityAccepted && showIndemnity && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ whiteSpace: "pre-line" }}
                  >
                    {meet.indemnityText}
                  </Typography>
                )}
              </Stack>
            )}
            <Stack direction="row" justifyContent="center" pt={2}>
              <Button
                variant="contained"
                disabled={isSubmitting || isSubmitDisabled}
                onClick={handleSubmit}
              >
                Submit application
              </Button>
            </Stack>
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
  );
}

export default MeetSignupSheet;
