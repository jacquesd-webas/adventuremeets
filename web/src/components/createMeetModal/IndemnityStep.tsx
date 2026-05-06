import {
  Alert,
  Box,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { LabeledField } from "./LabeledField";
import { StepProps } from "./CreateMeetState";
import { SelectTemplate } from "./SelectTemplate";
import { HelpBanner } from "./HelpBanner";

type IndemnityStepProps = StepProps & {
  disableIndemnityText?: boolean;
};

export const IndemnityStep = ({
  state,
  setState,
  disabled = false,
  disableIndemnityText = false,
  isHelpEnabled = false,
  isHelpBannerDismissed = false,
  onDismissHelpBanner,
}: IndemnityStepProps) => {
  return (
    <Box sx={{ position: "relative" }}>
      <Stack spacing={2}>
        <LabeledField
          label="Indemnity text"
          labelAction={
            <SelectTemplate
              organizationId={state.organizationId || undefined}
              disabled={disabled || disableIndemnityText}
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
            helperText={
              isHelpEnabled
                ? "Use this to record the wording attendees must accept before joining the meet. You can start from a template if your organization already has one."
                : undefined
            }
            disabled={disabled || disableIndemnityText}
            fullWidth
            multiline
            minRows={8}
          />
        </LabeledField>
        <Stack spacing={0.5}>
          <FormControlLabel
            control={
              <Switch
                checked={state.indemnityAccepted}
                disabled={disabled}
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
          {isHelpEnabled ? (
            <Typography variant="caption" color="text.secondary">
              Turn this on if attendees must explicitly accept the indemnity as
              part of their application. Once the meet is opened the wording
              cannot be changed for legal reasons. For minors a parent or
              guardian should accept on their behalf.
            </Typography>
          ) : null}
        </Stack>
        {disableIndemnityText ? (
          <Alert severity="warning">
            Once a meet has been opened the indemnity text may not be changed
            for legal reasons.
          </Alert>
        ) : null}
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
              message="Some meets may require attendees to accept specific indemnity wording as part of their application. It could be a liability waiver or just terms and conditions. Use this section to specify the wording and whether accepting it is mandatory. Once the meet is opened you won't be able to change the indemnity text for legal reasons, so make sure it's all set before opening."
              onDismiss={onDismissHelpBanner || (() => undefined)}
            />
          </Box>
        </Box>
      ) : null}
    </Box>
  );
};
