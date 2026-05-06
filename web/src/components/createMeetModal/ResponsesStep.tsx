import { Box, Stack, TextField, Typography } from "@mui/material";
import { LabeledField } from "./LabeledField";
import { StepProps } from "./CreateMeetState";
import { SelectTemplate } from "./SelectTemplate";
import { HelpBanner } from "./HelpBanner";

export const ResponsesStep = ({
  state,
  setState,
  disabled = false,
  isHelpEnabled = false,
  isHelpBannerDismissed = false,
  onDismissHelpBanner,
}: StepProps) => (
  <Box sx={{ position: "relative" }}>
    <Stack spacing={2}>
      <LabeledField
        label="Approved response"
        labelAction={
          <SelectTemplate
            organizationId={state.organizationId || undefined}
            disabled={disabled}
            onApplyTemplate={(template) =>
              setState((prev) => ({
                ...prev,
                approvedResponse:
                  prev.approvedResponse?.trim() ||
                  template.approvedResponse ||
                  "",
                rejectResponse:
                  prev.rejectResponse?.trim() || template.rejectResponse || "",
                waitlistResponse:
                  prev.waitlistResponse?.trim() ||
                  template.waitlistResponse ||
                  "",
              }))
            }
          />
        }
      >
        <TextField
          placeholder="Message sent to approved attendees"
          value={state.approvedResponse}
          onChange={(e) =>
            setState((prev) => ({ ...prev, approvedResponse: e.target.value }))
          }
          helperText={
            isHelpEnabled
              ? "This message is sent when someone is accepted onto the meet."
              : undefined
          }
          fullWidth
          multiline
          minRows={3}
          disabled={disabled}
        />
      </LabeledField>
      <LabeledField label="Reject response">
        <TextField
          placeholder="Message sent to rejected applicants"
          value={state.rejectResponse}
          onChange={(e) =>
            setState((prev) => ({ ...prev, rejectResponse: e.target.value }))
          }
          helperText={
            isHelpEnabled
              ? "Use this to politely explain that the attendee was not given a spot."
              : undefined
          }
          fullWidth
          multiline
          minRows={3}
          disabled={disabled}
        />
      </LabeledField>
      <LabeledField label="Waitlist response">
        <TextField
          placeholder="Message sent to people on the waitlist"
          value={state.waitlistResponse}
          onChange={(e) =>
            setState((prev) => ({ ...prev, waitlistResponse: e.target.value }))
          }
          helperText={
            isHelpEnabled
              ? "This message is used when someone is placed on the waitlist rather than confirmed immediately."
              : undefined
          }
          fullWidth
          multiline
          minRows={3}
          disabled={disabled}
        />
      </LabeledField>
      {isHelpEnabled ? (
        <Typography variant="body2" color="text.secondary">
          You can leave these blank and rely on defaults, but custom messages
          usually create a clearer experience for attendees.
        </Typography>
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
            message="These are the messages attendees receive after you or the system decides their outcome. You can customize them to give attendees more information about the meet, or keep then short or even blank for a minimal approach. If your organisation has templates you can use them here."
            onDismiss={onDismissHelpBanner || (() => undefined)}
          />
        </Box>
      </Box>
    ) : null}
  </Box>
);
