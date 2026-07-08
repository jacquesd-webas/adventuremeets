import { Box, InputAdornment, Stack, TextField } from "@mui/material";
import { CurrencySelect, getCurrencySymbol } from "./CurrencySelect";
import { LabeledField } from "./LabeledField";
import { StepProps } from "./CreateMeetState";
import { HelpBanner } from "./HelpBanner";

export const CostsStep = ({
  state,
  setState,
  disabled = false,
  isHelpEnabled = false,
  isHelpBannerDismissed = false,
  onDismissHelpBanner,
}: StepProps) => (
  <Box sx={{ position: "relative" }}>
    <Stack spacing={2}>
      <LabeledField label="Currency">
        <CurrencySelect
          value={state.currency}
          onChange={(value) =>
            setState((prev) => ({ ...prev, currency: value }))
          }
          disabled={disabled}
          helperText={
            isHelpEnabled
              ? "Pick the currency attendees should see for all pricing on this meet."
              : undefined
          }
        />
      </LabeledField>
      <LabeledField label="Cost">
        <TextField
          type="number"
          placeholder="Total cost (e.g. 24.99)"
          value={state.costCents}
          onChange={(e) =>
            setState((prev) => ({
              ...prev,
              costCents: e.target.value === "" ? "" : Number(e.target.value),
            }))
          }
          inputProps={{ step: "0.01", min: 0, "data-testid": "cost-input" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {getCurrencySymbol(state.currency)}
              </InputAdornment>
            ),
          }}
          helperText={
            isHelpEnabled
              ? "Enter the full amount an attendee is expected to pay. Leave blank or 0 if the meet is free."
              : undefined
          }
          fullWidth
          disabled={disabled}
        />
      </LabeledField>
      <LabeledField label="Deposit">
        <TextField
          type="number"
          placeholder="Deposit amount (e.g. 10.00)"
          value={state.depositCents}
          onChange={(e) =>
            setState((prev) => ({
              ...prev,
              depositCents: e.target.value === "" ? "" : Number(e.target.value),
            }))
          }
          inputProps={{ step: "0.01", min: 0, "data-testid": "deposit-input" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {getCurrencySymbol(state.currency)}
              </InputAdornment>
            ),
          }}
          helperText={
            isHelpEnabled
              ? "Use a deposit if you want people to secure their spot before paying the full balance."
              : undefined
          }
          fullWidth
          disabled={disabled}
        />
      </LabeledField>
    </Stack>
    {isHelpEnabled && !isHelpBannerDismissed ? (
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          p: 1,
          bgcolor: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(1px)",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 760 }}>
          <HelpBanner
            message="You can use this section to set a cost fot the meet. This is informational only and will not be used to process any payments. You can keep track of who has paid when reviewing applications and mark them as paid manually."
            onDismiss={onDismissHelpBanner || (() => undefined)}
          />
        </Box>
      </Box>
    ) : null}
  </Box>
);
