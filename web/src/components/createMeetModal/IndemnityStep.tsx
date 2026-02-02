import { FormControlLabel, Stack, Switch, TextField } from "@mui/material";
import { LabeledField } from "./LabeledField";
import { StepProps } from "./CreateMeetState";
import { SelectTemplate } from "./SelectTemplate";

export const IndemnityStep = ({ state, setState }: StepProps) => (
  <Stack spacing={2}>
    <LabeledField
      label="Indemnity text"
      labelAction={
        <SelectTemplate
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
    <FormControlLabel
      control={
        <Switch
          disabled
          checked={state.allowMinorSign}
          onChange={(e) =>
            setState((prev) => ({ ...prev, allowMinorSign: e.target.checked }))
          }
        />
      }
      label="Allow attendees to sign on behalf of minors"
    />
  </Stack>
);
