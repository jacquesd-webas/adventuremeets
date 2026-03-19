import {
  Alert,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { LabeledField } from "./LabeledField";
import { StepProps } from "./CreateMeetState";
import { SelectTemplate } from "./SelectTemplate";

type IndemnityStepProps = StepProps & {
  disableIndemnityText?: boolean;
};

export const IndemnityStep = ({
  state,
  setState,
  disableIndemnityText = false,
}: IndemnityStepProps) => (
  <Stack spacing={2}>
    <LabeledField
      label="Indemnity text"
      labelAction={
        <SelectTemplate
          organizationId={state.organizationId || undefined}
          disabled={disableIndemnityText}
          onApplyTemplate={(template) =>
            setState((prev) => ({
              ...prev,
              indemnityText:
                prev.indemnityText?.trim() || template.indemnity || "",
            }))
          }
        />
      }
    >
      <TextField
        placeholder="Paste or write indemnity text attendees must accept"
        value={state.indemnityText}
        onChange={(e) =>
          setState((prev) => ({ ...prev, indemnityText: e.target.value }))
        }
        disabled={disableIndemnityText}
        fullWidth
        multiline
        minRows={8}
      />
    </LabeledField>
    <FormControlLabel
      control={
        <Switch
          checked={state.indemnityAccepted}
          onChange={(e) =>
            setState((prev) => ({
              ...prev,
              indemnityAccepted: e.target.checked,
            }))
          }
        />
      }
      label="Require attendees to accept indemnity"
    />
    {disableIndemnityText ? (
      <Alert severity="warning">
        Once a meet has been opened the indemnity text may not be changed for
        legal reasons.
      </Alert>
    ) : null}
  </Stack>
);
