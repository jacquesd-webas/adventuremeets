import { MenuItem, TextField } from "@mui/material";

export type UserOption = {
  id: string;
  label: string;
};

type UserSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: UserOption[];
  currentUserId?: string;
};

export function UserSelect({ value, onChange, options, currentUserId }: UserSelectProps) {
  return (
    <TextField
      select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      SelectProps={{ MenuProps: { sx: { zIndex: 1501 } } }}
      fullWidth
    >
      {options.map((option) => (
        <MenuItem key={option.id} value={option.id}>
          {option.id === currentUserId ? `You (${option.label})` : option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
