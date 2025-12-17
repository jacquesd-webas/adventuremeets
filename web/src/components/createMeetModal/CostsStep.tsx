import { InputAdornment, Stack, TextField } from "@mui/material";
import { CurrencySelect, getCurrencySymbol } from "./CurrencySelect";
import { LabeledField } from "./LabeledField";
import { StepProps } from "./CreateMeetState";

export const CostsStep = ({ state, setState }: StepProps) => (
  <Stack spacing={2}>
    <LabeledField label="Currency">
      <CurrencySelect
        value={state.currency}
        onChange={(value) => setState((prev) => ({ ...prev, currency: value }))}
      />
    </LabeledField>
    <LabeledField label="Cost">
      <TextField
        type="number"
        placeholder="Total cost (e.g. 24.99)"
        value={state.costCents}
        onChange={(e) => setState((prev) => ({ ...prev, costCents: e.target.value === "" ? "" : Number(e.target.value) }))}
        inputProps={{ step: "0.01", min: 0 }}
        InputProps={{
          startAdornment: <InputAdornment position="start">{getCurrencySymbol(state.currency)}</InputAdornment>
        }}
        fullWidth
      />
    </LabeledField>
    <LabeledField label="Deposit">
      <TextField
        type="number"
        placeholder="Deposit amount (e.g. 10.00)"
        value={state.depositCents}
        onChange={(e) => setState((prev) => ({ ...prev, depositCents: e.target.value === "" ? "" : Number(e.target.value) }))}
        inputProps={{ step: "0.01", min: 0 }}
        InputProps={{
          startAdornment: <InputAdornment position="start">{getCurrencySymbol(state.currency)}</InputAdornment>
        }}
        fullWidth
      />
    </LabeledField>
  </Stack>
);
