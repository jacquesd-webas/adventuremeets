import { Autocomplete, TextField } from "@mui/material";

export type UserOption = {
  id: string;
  label: string;
};

type UserSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: UserOption[];
  currentUserId?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
};

export function UserSelect({
  value,
  onChange,
  options,
  currentUserId,
  error,
  helperText,
  disabled = false,
}: UserSelectProps) {
  const selectedOption = options.find((option) => option.id === value) ?? null;

  return (
    <Autocomplete
      options={options}
      value={selectedOption}
      onChange={(_event, option) => onChange(option?.id ?? "")}
      getOptionLabel={(option) =>
        option.id === currentUserId ? `You (${option.label})` : option.label
      }
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      autoHighlight
      componentsProps={{ popper: { sx: { zIndex: 1501 } } }}
      fullWidth
      disabled={disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          inputProps={{ ...params.inputProps, "aria-label": "Organiser" }}
          error={error}
          helperText={helperText}
        />
      )}
    />
  );
}
