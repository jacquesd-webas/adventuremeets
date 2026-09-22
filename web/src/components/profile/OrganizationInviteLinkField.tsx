import {
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import type { ClipboardEvent } from "react";

type OrganizationInviteLinkFieldProps = {
  value: string;
  copied: boolean;
  onCopy: () => void;
  label?: string;
  helperText?: string;
  copyTooltip?: string;
  copiedTooltip?: string;
  copyAriaLabel?: string;
  size?: "small" | "medium";
  type?: string;
  disabled?: boolean;
  preventCopyWhenDisabled?: boolean;
};

export function OrganizationInviteLinkField({
  value,
  copied,
  onCopy,
  label = "Invite link",
  helperText,
  copyTooltip = "Copy invite link",
  copiedTooltip = "Copied",
  copyAriaLabel = "Copy invite link",
  size = "small",
  type = "text",
  disabled = false,
  preventCopyWhenDisabled = false,
}: OrganizationInviteLinkFieldProps) {
  return (
    <TextField
      label={label}
      value={value}
      size={size}
      fullWidth
      type={type}
      helperText={helperText}
      InputProps={{
        readOnly: true,
        endAdornment: (
          <InputAdornment position="end">
            <Tooltip title={copied ? copiedTooltip : copyTooltip}>
              <span>
                <IconButton
                  onClick={onCopy}
                  disabled={!value || disabled}
                  size="small"
                  edge="end"
                  aria-label={copyAriaLabel}
                >
                  {copied ? (
                    <AssignmentTurnedInIcon fontSize="small" />
                  ) : (
                    <ContentCopyIcon fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          </InputAdornment>
        ),
      }}
      inputProps={{
        onCopy: (event: ClipboardEvent<HTMLInputElement>) => {
          if (preventCopyWhenDisabled && disabled) {
            event.preventDefault();
          }
        },
      }}
    />
  );
}
