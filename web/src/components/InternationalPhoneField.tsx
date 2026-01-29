import { InputAdornment, MenuItem, Select, TextField } from "@mui/material";

const phoneCountryOptions = [
  { code: "ZA", dialCode: "+27", label: "South Africa", flag: "🇿🇦" },
  { code: "US", dialCode: "+1", label: "United States", flag: "🇺🇸" },
  { code: "GB", dialCode: "+44", label: "United Kingdom", flag: "🇬🇧" },
  { code: "DE", dialCode: "+49", label: "Germany", flag: "🇩🇪" },
  { code: "FR", dialCode: "+33", label: "France", flag: "🇫🇷" },
  { code: "NG", dialCode: "+234", label: "Nigeria", flag: "🇳🇬" },
  { code: "KE", dialCode: "+254", label: "Kenya", flag: "🇰🇪" },
  { code: "IN", dialCode: "+91", label: "India", flag: "🇮🇳" },
  { code: "AU", dialCode: "+61", label: "Australia", flag: "🇦🇺" }
];

// eslint-disable-next-line react-refresh/only-export-components
export function getDefaultPhoneCountry(localeCountry?: string) {
  if (localeCountry && phoneCountryOptions.some((option) => option.code === localeCountry)) {
    return localeCountry;
  }
  return "ZA";
}

// eslint-disable-next-line react-refresh/only-export-components
export function splitInternationalPhone(value?: string) {
  if (!value) {
    return { country: "ZA", local: "" };
  }
  const trimmed = value.trim();
  if (!trimmed.startsWith("+")) {
    return { country: "ZA", local: trimmed };
  }
  const sorted = [...phoneCountryOptions].sort(
    (a, b) => b.dialCode.length - a.dialCode.length
  );
  const match = sorted.find((option) => trimmed.startsWith(option.dialCode));
  if (!match) {
    return { country: "ZA", local: trimmed.replace(/^\+/, "") };
  }
  return {
    country: match.code,
    local: trimmed.slice(match.dialCode.length).trim(),
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export function buildInternationalPhone(countryCode: string, local: string) {
  const option = phoneCountryOptions.find((item) => item.code === countryCode) || phoneCountryOptions[0];
  const trimmedLocal = local.trim();
  return trimmedLocal ? `${option.dialCode}${trimmedLocal}` : "";
}

type InternationalPhoneFieldProps = {
  label?: string;
  required?: boolean;
  placeholder?: string;
  country: string;
  local: string;
  onCountryChange: (value: string) => void;
  onLocalChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
};

export function InternationalPhoneField({
  label = "Phone",
  required,
  placeholder = "Mobile phone number",
  country,
  local,
  onCountryChange,
  onLocalChange,
  onBlur,
  disabled = false
}: InternationalPhoneFieldProps) {
  return (
    <TextField
      label={label}
      required={required}
      placeholder={placeholder}
      value={local}
      onChange={(e) => onLocalChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
      fullWidth
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Select
              value={country}
              onChange={(e) => onCountryChange(e.target.value as string)}
              variant="standard"
              disableUnderline
              inputProps={{ "aria-label": "Country selector", "data-testid": "country-select" }}
              sx={{ minWidth: 86 }}
              disabled={disabled}
            >
              {phoneCountryOptions.map((option) => (
                <MenuItem key={option.code} value={option.code}>
                  {option.flag} {option.dialCode}
                </MenuItem>
              ))}
            </Select>
          </InputAdornment>
        )
      }}
    />
  );
}
