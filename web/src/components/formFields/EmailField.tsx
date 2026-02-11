import { TextField } from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";

type EmailFieldProps = {
  label?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  hideLabel?: boolean;
};

export function EmailField({
  label = "Email",
  required,
  value,
  onChange,
  onBlur,
  placeholder = "you@example.com",
  fullWidth = true,
  disabled = false,
  error = false,
  helperText,
  hideLabel = false,
}: EmailFieldProps) {
  return (
    <TextField
      label={hideLabel ? undefined : label}
      hiddenLabel={hideLabel}
      InputLabelProps={hideLabel ? { shrink: true } : undefined}
      type="email"
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      fullWidth={fullWidth}
      disabled={disabled}
      error={error}
      helperText={helperText}
      InputProps={{
        startAdornment: <EmailOutlinedIcon fontSize="small" sx={{ mr: 1, color: "text.disabled" }} />
      }}
    />
  );
}
