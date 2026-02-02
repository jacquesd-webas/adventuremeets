import { FormControlLabel, Stack, Switch, TextField } from "@mui/material";
import { LabeledField } from "./LabeledField";
import { StepProps } from "./CreateMeetState";

export const IndemnityStep = ({ state, setState }: StepProps) => (
  <Stack spacing={2}>
    <FormControlLabel
      control={
        <Switch
          checked={state.indemnityAccepted}
          onChange={(e) => setState((prev) => ({ ...prev, indemnityAccepted: e.target.checked }))}
        />
      }
      label="Require attendees to accept indemnity"
    />
    <LabeledField label="Indemnity text">
      <TextField
        placeholder="Paste or write indemnity text attendees must accept"
        value={state.indemnityText}
        onChange={(e) => setState((prev) => ({ ...prev, indemnityText: e.target.value }))}
        fullWidth
        multiline
        minRows={8}
      />
    </LabeledField>
    <FormControlLabel
      control={
        <Switch
          disabled
          checked={state.allowMinorSign}
          onChange={(e) => setState((prev) => ({ ...prev, allowMinorSign: e.target.checked }))}
        />
      }
      label="Allow attendees to sign on behalf of minors"
    />
  </Stack>
);
