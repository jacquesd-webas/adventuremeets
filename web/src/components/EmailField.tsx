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
};

export function EmailField({
  label = "Email",
  required,
  value,
  onChange,
  onBlur,
  placeholder = "you@example.com",
  fullWidth = true
}: EmailFieldProps) {
  return (
    <TextField
      label={label}
      type="email"
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      fullWidth={fullWidth}
      InputProps={{
        startAdornment: <EmailOutlinedIcon fontSize="small" sx={{ mr: 1, color: "text.disabled" }} />
      }}
    />
  );
}
