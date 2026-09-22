import { IconButton, TextField } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";

type CheckinSearchProps = {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
};

export function CheckinSearch({ value, onChange, onClear }: CheckinSearchProps) {
  return (
    <TextField
      fullWidth
      size="small"
      variant="standard"
      placeholder="Search attendees"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      InputProps={{
        endAdornment: (
          <>
            {value ? (
              <IconButton
                aria-label="Clear search"
                edge="end"
                size="small"
                onClick={onClear}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            ) : null}
            <IconButton aria-label="Search attendees" edge="end" size="small">
              <SearchIcon fontSize="small" />
            </IconButton>
          </>
        ),
      }}
    />
  );
}
