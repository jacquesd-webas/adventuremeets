import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { type ReactNode } from "react";
import { EmailField } from "../formFields/EmailField";
import { NameField } from "../formFields/NameField";
import {
  InternationalPhoneField,
  buildInternationalPhone,
} from "../formFields/InternationalPhoneField";
import { GuestSwitchField } from "../meet/GuestSwitchField";
import { Spacer } from "../common/Spacer";
import { GuestInput } from "../../types/GuestInput";

function LabeledField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
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

export type MeetSignupFormFieldsProps = {
  meet: any;
  fullName: string;
  email: string;
  phoneCountry: string;
  phoneLocal: string;
  nameError?: string | null;
  emailError?: string | null;
  phoneError?: string | null;
  disableIdentityFields: boolean;
  disablePhone: boolean;
  disableGuests: boolean;
  guardianName: string;
  wantsGuests: boolean;
  guests: GuestInput[];
  metaValues: Record<string, any>;
  indemnityAccepted: boolean;
  isMinor: boolean;
  isSubmitDisabled: boolean;
  isSubmitting: boolean;
  isEditing: boolean;
  onSubmit: () => void;
  onCancelEdit?: () => void;
  onCheckDuplicate: () => void;
  onNameBlur: () => void;
  onEmailBlur: () => void;
  onPhoneBlur: () => void;
  setField: (key: string, value: any) => void;
  setMetaValue: (key: string, value: any) => void;
  setPhoneCountry: (value: string) => void;
  setPhoneLocal: (value: string) => void;
};

export function MeetSignupFormFields({
  meet,
  fullName,
  email,
  phoneCountry,
  phoneLocal,
  nameError,
  emailError,
  phoneError,
  disableIdentityFields,
  disablePhone,
  disableGuests,
  guardianName,
  wantsGuests,
  guests,
  metaValues,
  indemnityAccepted,
  isMinor,
  isSubmitDisabled,
  isSubmitting,
  isEditing,
  onSubmit,
  onCancelEdit,
  onNameBlur,
  onEmailBlur,
  onPhoneBlur,
  setField,
  setMetaValue,
  setPhoneCountry,
  setPhoneLocal,
}: MeetSignupFormFieldsProps) {
  return (
    <Stack spacing={2} mt={2}>
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
                  setField("isMinor", checked);
                  if (!checked) {
                    setField("guardianName", "");
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
          onChange={(value) => setField("fullName", value)}
          onBlur={onNameBlur}
          error={Boolean(nameError)}
          helperText={nameError || undefined}
          disabled={!isMinor && disableIdentityFields}
        />

        {isMinor ? (
          <>
            <Spacer height={2} />
            <Alert severity="info">
              {meet?.hasIndemnity
                ? "Minors must have a parent or guardian complete this form on their behalf and accept the indemnity."
                : "Contact details of a parent or guardian are required for minors."}
            </Alert>
            <LabeledField label="Parent or Guardian Name">
              <NameField
                required
                value={guardianName}
                onChange={(value) => setField("guardianName", value)}
                onBlur={onNameBlur}
                error={Boolean(nameError)}
                helperText={nameError || undefined}
                disabled={disableIdentityFields}
                placeholder="Parent or guardian name"
              />
            </LabeledField>
          </>
        ) : null}
      </Stack>

      <LabeledField
        label={isMinor ? "Parent or Guardian Email" : "Email"}
        required
      >
        <EmailField
          required
          value={email}
          onChange={(value) => setField("email", value)}
          onBlur={onEmailBlur}
          error={Boolean(emailError)}
          helperText={emailError || undefined}
          hideLabel
          disabled={disableIdentityFields}
        />
      </LabeledField>
      <LabeledField
        label={isMinor ? "Parent or Guardian Phone" : "Phone"}
        required
      >
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
          onBlur={onPhoneBlur}
          error={Boolean(phoneError)}
          helperText={phoneError || undefined}
          hideLabel
          disabled={disablePhone}
        />
      </LabeledField>
      <GuestSwitchField
        allowGuests={Boolean(meet.allowGuests)}
        disabled={disableGuests}
        wantsGuests={wantsGuests}
        guests={guests}
        maxGuests={Number(meet.maxGuests || 0)}
        onToggle={(checked) => {
          setField("wantsGuests", checked);
          if (!checked) {
            setField("guests", []);
          }
        }}
        onGuestsChange={(nextGuests) => setField("guests", nextGuests)}
        LabeledFieldComponent={LabeledField}
      />
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
