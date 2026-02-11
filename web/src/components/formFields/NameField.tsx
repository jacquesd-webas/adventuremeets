import { TextField } from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

type NameFieldProps = {
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
};

export function NameField({
  label,
  required,
  value,
  onChange,
  onBlur,
  placeholder = "Your name",
  fullWidth = true,
  disabled = false,
  error = false,
  helperText,
}: NameFieldProps) {
  return (
    <TextField
      label={label}
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
        startAdornment: (
          <PersonOutlineIcon fontSize="small" sx={{ mr: 1, color: "text.disabled" }} />
        ),
      }}
    />
  );
}
