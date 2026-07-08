import { useCallback, useEffect, useRef, useState } from "react";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

type MeetSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  fullWidth?: boolean;
  compact?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
};

export function MeetSearchField({
  value,
  onChange,
  fullWidth = true,
  compact = false,
  expanded,
  onExpandedChange,
}: MeetSearchFieldProps) {
  const [internalExpanded, setInternalExpanded] = useState(Boolean(value));
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isExpanded = expanded ?? internalExpanded;

  const setIsExpanded = useCallback(
    (nextExpanded: boolean) => {
      if (expanded === undefined) {
        setInternalExpanded(nextExpanded);
      }
      onExpandedChange?.(nextExpanded);
    },
    [expanded, onExpandedChange],
  );

  useEffect(() => {
    if (value) {
      setIsExpanded(true);
    }
  }, [setIsExpanded, value]);

  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    }
  }, [isExpanded]);

  if (!isExpanded) {
    return (
      <IconButton
        aria-label="Search meets"
        onClick={() => setIsExpanded(true)}
        size="small"
      >
        <SearchIcon sx={{ fontSize: 24 }} />
      </IconButton>
    );
  }

  return (
    <TextField
      inputRef={inputRef}
      size="small"
      variant="standard"
      placeholder="Search meets"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={() => {
        if (!value.trim()) {
          setIsExpanded(false);
        }
      }}
      sx={{ width: fullWidth ? "100%" : compact ? 220 : 320 }}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <SearchIcon sx={{ fontSize: 22 }} color="disabled" />
          </InputAdornment>
        ),
      }}
    />
  );
}
