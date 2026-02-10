import {
  IconButton,
  InputAdornment,
  TextField,
  TextFieldProps,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useState } from "react";

type PasswordFieldProps = Omit<TextFieldProps, "type" | "InputProps" | "onChange"> & {
  value: string;
  onValueChange: (value: string) => void;
};

export function PasswordField({
  value,
  onValueChange,
  ...props
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <TextField
      {...props}
      type={showPassword ? "text" : "password"}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      InputProps={{
        startAdornment: (
          <LockOutlinedIcon
            fontSize="small"
            sx={{ mr: 1, color: "text.disabled" }}
          />
        ),
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((prev) => !prev)}
              edge="end"
            >
              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
}
