import { Stack, TextField } from "@mui/material";
import { LabeledField } from "./LabeledField";
import { StepProps } from "./CreateMeetState";

export const BasicInfoStep = ({ state, setState }: StepProps) => (
  <Stack spacing={2}>
    <LabeledField label="Meet name" required>
      <TextField
        placeholder="Give your meet a name"
        value={state.name}
        onChange={(e) => setState((prev) => ({ ...prev, name: e.target.value }))}
        fullWidth
      />
    </LabeledField>
    <LabeledField label="Description" required>
      <TextField
        placeholder="Describe your meet in detail here"
        value={state.description}
        onChange={(e) => setState((prev) => ({ ...prev, description: e.target.value }))}
        fullWidth
        multiline
        minRows={6}
      />
    </LabeledField>
    <LabeledField label="Organizer" required>
      <TextField
        placeholder="Who is organizing this meet?"
        value={state.organizer}
        onChange={(e) => setState((prev) => ({ ...prev, organizer: e.target.value }))}
        fullWidth
      />
    </LabeledField>
  </Stack>
);
