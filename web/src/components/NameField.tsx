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
      InputProps={{
        startAdornment: (
          <PersonOutlineIcon fontSize="small" sx={{ mr: 1, color: "text.disabled" }} />
        ),
      }}
    />
  );
}
