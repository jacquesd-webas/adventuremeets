import { Stack, TextField } from "@mui/material";
import { LabeledField } from "./LabeledField";
import { StepProps } from "./CreateMeetState";

export const ResponsesStep = ({ state, setState }: StepProps) => (
  <Stack spacing={2}>
    <LabeledField label="Approved response">
      <TextField
        placeholder="Message sent to approved attendees"
        value={state.approvedResponse}
        onChange={(e) => setState((prev) => ({ ...prev, approvedResponse: e.target.value }))}
        fullWidth
        multiline
        minRows={3}
      />
    </LabeledField>
    <LabeledField label="Reject response">
      <TextField
        placeholder="Message sent to rejected applicants"
        value={state.rejectResponse}
        onChange={(e) => setState((prev) => ({ ...prev, rejectResponse: e.target.value }))}
        fullWidth
        multiline
        minRows={3}
      />
    </LabeledField>
    <LabeledField label="Waitlist response">
      <TextField
        placeholder="Message sent to people on the waitlist"
        value={state.waitlistResponse}
        onChange={(e) => setState((prev) => ({ ...prev, waitlistResponse: e.target.value }))}
        fullWidth
        multiline
        minRows={3}
      />
    </LabeledField>
  </Stack>
);
