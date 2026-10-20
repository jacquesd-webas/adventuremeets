import { useState } from "react";
import {
  Alert,
  Box,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { LabeledField } from "./LabeledField";
import { StepProps } from "./CreateMeetState";
import { SelectTemplate } from "./SelectTemplate";
import { HelpBanner } from "./HelpBanner";
import { IndemnityPdfUpload } from "./IndemnityPdfUpload";
import { useIndemnityTemplate } from "../../hooks/useIndemnityTemplate";

type IndemnityStepProps = StepProps & {
  disableIndemnityText?: boolean;
  meetId?: string | null;
};

export const IndemnityStep = ({
  state,
  setState,
  disabled = false,
  disableIndemnityText = false,
  meetId,
  isHelpEnabled = false,
  isHelpBannerDismissed = false,
  onDismissHelpBanner,
}: IndemnityStepProps) => {
  const { isLoading, remove } = useIndemnityTemplate(meetId);
  const [modeError, setModeError] = useState<string | null>(null);

  const changePdfMode = async (enabled: boolean) => {
    setModeError(null);
    if (enabled) {
      setState((prev) => ({
        ...prev,
        usePdfIndemnity: true,
        indemnityAccepted: true,
      }));
      return;
    }
    try {
      if (meetId) await remove.mutateAsync();
      setState((prev) => ({
        ...prev,
        usePdfIndemnity: false,
        questions: prev.questions.filter(
          (question) => !question.pdfFormFieldId,
        ),
      }));
    } catch (error) {
      setModeError(
        error instanceof Error
          ? error.message
          : "Could not remove the PDF form",
      );
    }
  };

  return (
    <Box sx={{ position: "relative" }}>
      <Stack spacing={2}>
        <LabeledField
          label="Indemnity Form"
          labelAction={
            <SelectTemplate
              organizationId={state.organizationId || undefined}
              disabled={
                disabled || disableIndemnityText || state.usePdfIndemnity
              }
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
          {state.usePdfIndemnity ? (
            <IndemnityPdfUpload
              meetId={meetId}
              disabled={disabled || disableIndemnityText}
              setState={setState}
            />
          ) : (
            <TextField
              placeholder="Paste or write indemnity text attendees must accept"
              value={state.indemnityText}
              onChange={(e) =>
                setState((prev) => ({ ...prev, indemnityText: e.target.value }))
              }
              helperText={
                isHelpEnabled
                  ? "Use this to record the wording attendees must accept before joining the meet. You can start from a template if your organisation already has one."
                  : undefined
              }
              disabled={disabled || disableIndemnityText}
              fullWidth
              multiline
              minRows={8}
            />
          )}
        </LabeledField>
        <Stack spacing={0.5}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Switch
              checked={state.indemnityAccepted}
              disabled={disabled || state.usePdfIndemnity}
              inputProps={{
                "aria-label": "Require attendees to accept indemnity",
              }}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  indemnityAccepted: e.target.checked,
                  needIndemnityConfirmationEmail: e.target.checked
                    ? prev.needIndemnityConfirmationEmail
                    : false,
                  needIndemnityConfirmationPhone: e.target.checked
                    ? prev.needIndemnityConfirmationPhone
                    : false,
                }))
              }
            />
            <Typography>Require attendees to accept indemnity</Typography>
          </Stack>
          {isHelpEnabled ? (
            <Typography variant="caption" color="text.secondary">
              Turn this on if attendees must explicitly accept the indemnity as
              part of their application. Once the meet is opened the wording
              cannot be changed for legal reasons. For minors a parent or
              guardian should accept on their behalf.
            </Typography>
          ) : null}
        </Stack>
        {state.indemnityAccepted ? (
          <Stack spacing={0.5}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Switch
                checked={state.needIndemnityConfirmationEmail}
                disabled={disabled}
                inputProps={{
                  "aria-label":
                    "Require sign-in or email confirmation for indemnity",
                }}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    needIndemnityConfirmationEmail: e.target.checked,
                    requireEmail: e.target.checked ? true : prev.requireEmail,
                  }))
                }
              />
              <Typography>Enable strict indemnity</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Attendees must be signed in to accept indemnity or confirm their
              acceptance by email.
            </Typography>
          </Stack>
        ) : null}
        <Stack spacing={0.5}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Switch
              checked={state.usePdfIndemnity}
              disabled={
                disabled ||
                disableIndemnityText ||
                isLoading ||
                remove.isPending
              }
              inputProps={{ "aria-label": "Use PDF indemnity form" }}
              onChange={(event) => {
                void changePdfMode(event.target.checked);
              }}
            />
            <Typography>Use PDF indemnity form</Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Instead of electronic indemnity you may upload a fillable PDF for
            the attendees to complete and sign. Fields in the PDF are
            automatically mapped to questions in the next step.
          </Typography>
        </Stack>
        {modeError ? <Alert severity="error">{modeError}</Alert> : null}
        {disableIndemnityText ? (
          <Alert severity="warning">
            Once a meet has been opened the indemnity may not be changed for
            legal reasons.
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
              message={
                <>
                  Some meets may require attendees to accept indemnity as part
                  of their application. Add wording or upload a fillable PDF,
                  then choose whether acceptance is mandatory.
                  <br />
                  <br />
                  Once the meet is open for applications you won't be able to
                  change the indemnity for legal reasons, so preview it before
                  opening.
                  <br />
                  <br />
                  If your organisation has standard indemnity wording, you can
                  import it here.
                </>
              }
              onDismiss={onDismissHelpBanner || (() => undefined)}
            />
          </Box>
        </Box>
      ) : null}
    </Box>
  );
};
