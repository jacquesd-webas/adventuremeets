import {
  Box,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { LabeledField } from "./LabeledField";
import { StepProps, FieldError, getFieldError } from "./CreateMeetState";
import { HelpBanner } from "./HelpBanner";

type LimitsStepProps = StepProps & {
  errors?: FieldError[];
};

export const LimitsStep = ({
  state,
  setState,
  errors = [],
  disabled = false,
  isHelpEnabled = false,
  isHelpBannerDismissed = false,
  onDismissHelpBanner,
}: LimitsStepProps) => (
  <Box sx={{ position: "relative" }}>
    <Stack spacing={2}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ width: "100%" }}
        alignItems="flex-start"
      >
        <LabeledField label="Applications open" sx={{ flex: 1 }}>
          <TextField
            type="datetime-local"
            placeholder="When can attendees start applying?"
            value={state.openingDate}
            onChange={(e) =>
              setState((prev) => ({ ...prev, openingDate: e.target.value }))
            }
            fullWidth
            InputLabelProps={{ shrink: true }}
            error={Boolean(getFieldError(errors, "openingDate"))}
            helperText={
              getFieldError(errors, "openingDate") ||
              (isHelpEnabled
                ? "Set a time when applications should start being accepted. If you leave this blank people will be able to apply as soon as the meet is published."
                : "Leave blank to open on publish")
            }
            disabled={disabled}
          />
        </LabeledField>
        <LabeledField label="Applications close" sx={{ flex: 1 }}>
          <TextField
            type="datetime-local"
            placeholder="When do applications close?"
            value={state.closingDate}
            onChange={(e) =>
              setState((prev) => ({ ...prev, closingDate: e.target.value }))
            }
            fullWidth
            InputLabelProps={{ shrink: true }}
            error={Boolean(getFieldError(errors, "closingDate"))}
            helperText={
              getFieldError(errors, "closingDate") ||
              (isHelpEnabled
                ? "Set a time when applications should stop being accepted. If you leave this blank people will be able to apply until the meet starts. Bear in mind that you can also close the meet manually as soon as you have your final attendee list."
                : "Leave blank to close when meet starts")
            }
            disabled={disabled}
          />
        </LabeledField>
      </Stack>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ width: "100%" }}
        alignItems="flex-start"
      >
        <LabeledField label="Capacity" sx={{ flex: 1 }}>
          <TextField
            type="number"
            placeholder="Maximum participants"
            value={state.capacity}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                capacity: e.target.value === "" ? "" : Number(e.target.value),
              }))
            }
            fullWidth
            error={Boolean(getFieldError(errors, "capacity"))}
            helperText={
              getFieldError(errors, "capacity") ||
              (isHelpEnabled
                ? "Set the maximum number of attendee spots. Use 0 or leave blank for no hard cap."
                : "Leave blank or use 0 for unlimited")
            }
            disabled={disabled}
          />
        </LabeledField>
        <LabeledField label="Waitlist size" sx={{ flex: 1 }}>
          <TextField
            type="number"
            placeholder="How many on the waitlist?"
            value={state.waitlistSize}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                waitlistSize:
                  e.target.value === "" ? "" : Number(e.target.value),
              }))
            }
            fullWidth
            error={Boolean(getFieldError(errors, "waitlistSize"))}
            helperText={
              getFieldError(errors, "waitlistSize") ||
              (isHelpEnabled
                ? "Choose how many extra people can wait for a spot if the meet fills up."
                : "Use 0 for no waitlist")
            }
            disabled={disabled}
          />
        </LabeledField>
      </Stack>
      <Stack spacing={1}>
        <FormControlLabel
          control={
            <Switch
              checked={state.autoApprove}
              disabled={disabled}
              onChange={(e) =>
                setState((prev) => ({ ...prev, autoApprove: e.target.checked }))
              }
            />
          }
          label="Automatically approve applications"
        />
        {isHelpEnabled ? (
          <Typography variant="caption" color="text.secondary">
            Turn this on if people should immediately get a confirmed or
            waitlisted result without manual review.
          </Typography>
        ) : null}
        <FormControlLabel
          control={
            <Switch
              checked={state.allowGuests}
              disabled={disabled}
              onChange={(e) =>
                setState((prev) => ({ ...prev, allowGuests: e.target.checked }))
              }
            />
          }
          label="Allow attendees to bring guests"
        />
        {isHelpEnabled ? (
          <Typography variant="caption" color="text.secondary">
            This will ask attendees if they want to bring guests. You can set a
            limit or later allow only specific attendees to bring guests when
            reviewing applications.
          </Typography>
        ) : null}
        {state.allowGuests && (
          <LabeledField label="Guests per attendee">
            <TextField
              type="number"
              placeholder="How many guests per attendee?"
              value={state.maxGuests}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  maxGuests:
                    e.target.value === "" ? "" : Number(e.target.value),
                }))
              }
              helperText={
                isHelpEnabled
                  ? "Set the maximum extra guests each attendee may add to their application."
                  : undefined
              }
              fullWidth
              disabled={disabled}
            />
          </LabeledField>
        )}
        <FormControlLabel
          control={
            <Switch
              checked={state.allowSelfCheckin}
              disabled={disabled}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  allowSelfCheckin: e.target.checked,
                  allowWalkins: e.target.checked ? prev.allowWalkins : false,
                }))
              }
            />
          }
          label="Allow self check-in"
        />
        {isHelpEnabled ? (
          <Typography variant="caption" color="text.secondary">
            Show a self check-in QR code on the check-in page so attendees can
            open the meet from their own devices.
          </Typography>
        ) : null}
        <FormControlLabel
          control={
            <Switch
              checked={state.allowWalkins}
              disabled={disabled}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  allowWalkins: e.target.checked,
                  allowSelfCheckin: e.target.checked
                    ? true
                    : prev.allowSelfCheckin,
                }))
              }
            />
          }
          label="Allow walk-ins"
        />
        {isHelpEnabled ? (
          <Typography variant="caption" color="text.secondary">
            Allow people on-site to self check in even if they were not already
            on the attendee list. This automatically enables self check-in.
          </Typography>
        ) : null}
      </Stack>
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
            message="You can use limits to control when people can apply, how many spots are available, whether a waitlist should exist, and whether guests can be invited. If you do not set any dates or limits the meet will be open to unlimited applications until it starts. You can edit all of these settings later if needed."
            onDismiss={onDismissHelpBanner || (() => undefined)}
          />
        </Box>
      </Box>
    ) : null}
  </Box>
);
