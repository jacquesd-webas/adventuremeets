import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { StepProps } from "./CreateMeetState";
import MeetStatusEnum from "../../types/MeetStatusEnum";

type FinishStepProps = StepProps & {
  shareCode?: string | null;
  isEditing?: boolean;
};

export function FinishStep({
  state,
  setState,
  errors = [],
  shareCode,
  disabled = false,
  isEditing = false,
}: FinishStepProps) {
  const [copied, setCopied] = useState(false);
  const showPostponedWarning =
    isEditing && state.statusId === MeetStatusEnum.Postponed;
  const shareUrl = useMemo(() => {
    if (!shareCode) return "";
    if (typeof window === "undefined") return `/meets/${shareCode}`;
    return `${window.location.origin}/meets/${shareCode}`;
  }, [shareCode]);

  const handleCopy = async () => {
    if (!shareUrl || typeof navigator === "undefined") return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Share this meet</Typography>
      {errors.length > 0 ? (
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            This meet cannot be shared until all necessary fields are completed
            and no errors remain.
          </Typography>

          <ul
            style={{ margin: 0, paddingTop: "1.5rem", paddingLeft: "1.5rem" }}
          >
            {errors.map((error) => (
              <li key={error.field}>
                <Typography variant="body2" color="error">
                  {error.message} (see step {error.step + 1})
                </Typography>
              </li>
            ))}
          </ul>
        </Stack>
      ) : (
        <Typography color="text.secondary">
          Send the link below so attendees can sign up.
        </Typography>
      )}
      {errors.length === 0 && (
        <>
          <TextField
            value={shareUrl}
            fullWidth
            disabled={disabled}
            InputProps={{ readOnly: true }}
            inputProps={{ "data-testid": "share-link-input" }}
          />
          <Button variant="contained" onClick={handleCopy} disabled={!shareUrl}>
            {copied ? "Copied" : "Copy link"}
          </Button>
        </>
      )}
      {showPostponedWarning ? (
        <>
          <Alert severity="warning">
            The meet was postponed. All attendees should re-confirm, unless you
            choose to keep their current status as is.
          </Alert>
          <FormControlLabel
            control={
              <Checkbox
                checked={state.attendeeReconfirm}
                onChange={(_event, checked) =>
                  setState((prev) => ({
                    ...prev,
                    attendeeReconfirm: checked,
                  }))
                }
                disabled={disabled}
              />
            }
            label="Require attendees to re-confirm their attendance"
          />
        </>
      ) : null}
    </Stack>
  );
}
