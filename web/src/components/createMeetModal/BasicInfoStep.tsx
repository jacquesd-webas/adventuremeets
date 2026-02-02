import { Stack, TextField } from "@mui/material";
import { LabeledField } from "./LabeledField";
import { StepProps } from "./CreateMeetState";
import { UserSelect, UserOption } from "./UserSelect";

type BasicInfoStepProps = StepProps & {
  organizers: UserOption[];
  currentUserId?: string;
  errors?: Record<string, string | undefined>;
};

export const BasicInfoStep = ({ state, setState, organizers, currentUserId, errors }: BasicInfoStepProps) => (
  <Stack spacing={2}>
    <LabeledField label="Meet name" required>
      <TextField
        placeholder="Give your meet a name"
        value={state.name}
        error={Boolean(errors?.name)}
        helperText={errors?.name}
        onChange={(e) => setState((prev) => ({ ...prev, name: e.target.value }))}
        fullWidth
      />
    </LabeledField>
    <LabeledField label="Description" required>
      <TextField
        placeholder="Describe your meet in detail here"
        value={state.description}
        error={Boolean(errors?.description)}
        helperText={errors?.description}
        onChange={(e) => setState((prev) => ({ ...prev, description: e.target.value }))}
        fullWidth
        multiline
        minRows={6}
      />
    </LabeledField>
    <LabeledField label="Organizer" required>
      <UserSelect
        value={state.organizerId}
        onChange={(value) => setState((prev) => ({ ...prev, organizerId: value }))}
        options={organizers}
        currentUserId={currentUserId}
        error={Boolean(errors?.organizerId)}
        helperText={errors?.organizerId}
      />
    </LabeledField>
  </Stack>
);
