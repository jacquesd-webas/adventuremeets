import { FormControlLabel, Stack, Switch, TextField } from "@mui/material";
import { LabeledField } from "./LabeledField";
import { StepProps } from "./CreateMeetState";

export const LimitsStep = ({ state, setState }: StepProps) => (
  <Stack spacing={2}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ width: "100%" }} alignItems="stretch">
      <LabeledField label="Applications open" required sx={{ flex: 1 }}>
        <TextField
          type="datetime-local"
          placeholder="When can attendees start applying?"
          value={state.openingDate}
          onChange={(e) => setState((prev) => ({ ...prev, openingDate: e.target.value }))}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
      </LabeledField>
      <LabeledField label="Applications close" required sx={{ flex: 1 }}>
        <TextField
          type="datetime-local"
          placeholder="When do applications close?"
          value={state.closingDate}
          onChange={(e) => setState((prev) => ({ ...prev, closingDate: e.target.value }))}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
      </LabeledField>
    </Stack>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ width: "100%" }} alignItems="stretch">
      <LabeledField label="Capacity" required sx={{ flex: 1 }}>
        <TextField
          type="number"
          placeholder="Maximum participants"
          value={state.capacity}
          onChange={(e) => setState((prev) => ({ ...prev, capacity: e.target.value === "" ? "" : Number(e.target.value) }))}
          fullWidth
        />
      </LabeledField>
      <LabeledField label="Waitlist size" sx={{ flex: 1 }}>
        <TextField
          type="number"
          placeholder="How many on the waitlist?"
          value={state.waitlistSize}
          onChange={(e) => setState((prev) => ({ ...prev, waitlistSize: e.target.value === "" ? "" : Number(e.target.value) }))}
          fullWidth
        />
      </LabeledField>
    </Stack>
    <Stack spacing={1}>
      <FormControlLabel
        control={
          <Switch
            checked={state.autoApprove}
            onChange={(e) => setState((prev) => ({ ...prev, autoApprove: e.target.checked }))}
          />
        }
        label="Automatically approve applications"
      />
      <FormControlLabel
        control={
          <Switch
            checked={state.autoCloseWaitlist}
            onChange={(e) => setState((prev) => ({ ...prev, autoCloseWaitlist: e.target.checked }))}
          />
        }
        label="Automatically close when waitlist is full"
      />
      <FormControlLabel
        control={
          <Switch
            checked={state.allowGuests}
            onChange={(e) => setState((prev) => ({ ...prev, allowGuests: e.target.checked }))}
          />
        }
        label="Allow attendees to bring guests"
      />
      {state.allowGuests && (
        <LabeledField label="Guests per attendee">
          <TextField
            type="number"
            placeholder="How many guests per attendee?"
            value={state.maxGuests}
            onChange={(e) => setState((prev) => ({ ...prev, maxGuests: e.target.value === "" ? "" : Number(e.target.value) }))}
            fullWidth
          />
        </LabeledField>
      )}
    </Stack>
  </Stack>
);
