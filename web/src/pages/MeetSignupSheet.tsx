import {
  Box,
  Container,
  Paper,
  Stack,
  Typography,
  Chip,
  FormControlLabel,
  Switch,
  Button,
  TextField,
  MenuItem,
  Alert
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PlaceIcon from "@mui/icons-material/Place";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { MeetNotFound } from "../components/MeetNotFound";
import { useFetchMeetSignup } from "../hooks/useFetchMeetSignup";
import { useAddAttendee } from "../hooks/useAddAttendee";
import { useCheckMeetAttendee } from "../hooks/useCheckMeetAttendee";
import { useApi } from "../hooks/useApi";
import { MeetSignupDuplicateDialog } from "../components/MeetSignupDuplicateDialog";
import { MeetSignupSubmitted } from "../components/MeetSignupSubmitted";
import { useMeetSignupSheetState } from "./MeetSignupSheetState";
import { getLocaleDefaults } from "../utils/locale";
import {
  InternationalPhoneField,
  buildInternationalPhone,
  getDefaultPhoneCountry,
} from "../components/InternationalPhoneField";
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
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "true";
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
    return getDefaultPhoneCountry(localeCountry);
  });
  const [phoneLocal, setPhoneLocal] = useState("");
  const [lastCheckedContact, setLastCheckedContact] = useState<{
    email: string;
    phone: string;
  } | null>(null);
  const {
    indemnityAccepted,
    showIndemnity,
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

  const placeholderImageUrl =
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=420&q=60";
  const imageUrl = meet?.imageUrl ?? placeholderImageUrl;
  const hasImage = Boolean(imageUrl);

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
            PREVIEW ONLY - No changes will be saved on this form
          </Typography>
        </Box>
      ) : null}
      <Container
        maxWidth="md"
        sx={{
          py: 6,
          pt: isPreview ? 10 : 6,
          height: "100vh",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <Paper variant="outlined" sx={{ p: 3 }}>
          {isLoading ? (
            <Typography color="text.secondary">Loading meet...</Typography>
          ) : (
            <Stack spacing={1.5}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="h4" fontWeight={700}>
                  {meet.name}
                </Typography>
                <Button variant="outlined" size="small" href="/login">
                  Login
                </Button>
              </Stack>
              {dateLabel && (
                <Typography variant="subtitle1" color="text.secondary">
                  {dateLabel}
                </Typography>
              )}
              {hasImage ? (
                <>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems="flex-start"
                    mt={1}
                  >
                    <Box
                      component="img"
                      src={imageUrl}
                      alt="Meet preview"
                      sx={{
                        width: 180,
                        height: 130,
                        borderRadius: 2,
                        objectFit: "cover",
                      }}
                    />
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PersonOutlineIcon fontSize="small" color="disabled" />
                        <Typography variant="body2">
                          {meet.organizerName}
                        </Typography>
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
                      {typeof meet.capacity === "number" && (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <GroupOutlinedIcon
                            fontSize="small"
                            color="disabled"
                          />
                          <Typography variant="body2">
                            {meet.capacity} spots
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
                  </Stack>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    {meet.description}
                  </Typography>
                </>
              ) : (
                <>
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
                      <Typography variant="body2">
                        {meet.organizerName}
                      </Typography>
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
                    {typeof meet.capacity === "number" && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <GroupOutlinedIcon fontSize="small" color="disabled" />
                        <Typography variant="body2">
                          {meet.capacity} spots
                        </Typography>
                      </Stack>
                    )}
                  </Stack>
                  <Typography variant="body1" color="text.secondary">
                    {meet.description}
                  </Typography>
                </>
              )}
              <Stack spacing={2} mt={2}>
                <LabeledField label="Full name" required>
                  <TextField
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setField("fullName", e.target.value)}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <PersonOutlineIcon
                          fontSize="small"
                          sx={{ mr: 1, color: "text.disabled" }}
                        />
                      ),
                    }}
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
                      setField(
                        "phone",
                        buildInternationalPhone(value, phoneLocal)
                      );
                    }}
                    onLocalChange={(value) => {
                      setPhoneLocal(value);
                      setField(
                        "phone",
                        buildInternationalPhone(phoneCountry, value)
                      );
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
                            onChange={(e) =>
                              setMetaValue(key, e.target.checked)
                            }
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
                            field.field_type === "number" &&
                              e.target.value !== ""
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
                  <Alert severity="warning" icon={false} sx={{ whiteSpace: "pre-line" }}>
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
    </Box>
  );
}

export default MeetSignupSheet;
