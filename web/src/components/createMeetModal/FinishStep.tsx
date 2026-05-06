import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { StepProps } from "./CreateMeetState";
import MeetStatusEnum from "../../types/MeetStatusEnum";
import { HelpBanner } from "./HelpBanner";

type FinishStepProps = StepProps & {
  shareCode?: string | null;
  isEditing?: boolean;
  onPreview?: () => void;
};

export function FinishStep({
  state,
  setState,
  errors = [],
  shareCode,
  disabled = false,
  isEditing = false,
  onPreview,
  isHelpEnabled = false,
  isHelpBannerDismissed = false,
  onDismissHelpBanner,
}: FinishStepProps) {
  const [copied, setCopied] = useState(false);

  const showPostponedWarning =
    isEditing && state.statusId === MeetStatusEnum.Postponed;

  const shareUrl = useMemo(() => {
    if (!shareCode) return "";
    if (typeof window === "undefined") return `/meets/${shareCode}`;
    return `${window.location.origin}/meets/${shareCode}`;
  }, [shareCode]);

  const previewUrl = useMemo(() => {
    if (!shareCode) return "";
    const params = new URLSearchParams({
      preview: "true",
    });
    if (typeof window === "undefined") {
      return `/meets/${shareCode}?${params.toString()}`;
    }
    return `${window.location.origin}/meets/${shareCode}?${params.toString()}`;
  }, [shareCode]);

  const handleCopy = async () => {
    if (!shareUrl || typeof navigator === "undefined") return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box sx={{ position: "relative" }}>
      <Stack spacing={2}>
        <Typography variant="h6">Share this meet</Typography>
        {errors.length > 0 ? (
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              This meet cannot be shared until all necessary fields are
              completed and no errors remain.
            </Typography>

            <ul
              style={{ margin: 0, paddingTop: "1.5rem", paddingLeft: "1.5rem" }}
            >
              {errors.map((error) => (
                <li key={error.field}>
                  <Typography variant="body2" color="error">
                    {error.message} (see step {error.step + 1})
                  </Typography>
                </li>
              ))}
            </ul>
          </Stack>
        ) : (
          <Typography color="text.secondary">
            {isHelpEnabled
              ? "Once everything required is complete, you can copy the share link and send it to attendees."
              : "Send the link below so attendees can sign up."}
          </Typography>
        )}
        {errors.length === 0 && (
          <>
            <TextField
              value={shareUrl}
              fullWidth
              disabled={disabled}
              helperText={
                isHelpEnabled
                  ? "This is the signup link attendees can use to view and apply for the meet."
                  : undefined
              }
              InputProps={{ readOnly: true }}
              inputProps={{ "data-testid": "share-link-input" }}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                variant="outlined"
                onClick={onPreview}
                disabled={typeof onPreview !== "function" || !previewUrl}
              >
                Preview
              </Button>
              <Button
                variant="contained"
                onClick={handleCopy}
                disabled={!shareUrl}
              >
                {copied ? "Copied" : "Copy link"}
              </Button>
            </Stack>
          </>
        )}
        {showPostponedWarning ? (
          <>
            <Alert severity="warning">
              The meet was postponed. All attendees should re-confirm, unless
              you choose to keep their current status as is.
            </Alert>
            <FormControlLabel
              control={
                <Checkbox
                  checked={state.attendeeReconfirm}
                  onChange={(_event, checked) =>
                    setState((prev) => ({
                      ...prev,
                      attendeeReconfirm: checked,
                    }))
                  }
                  disabled={disabled}
                />
              }
              label="Require attendees to re-confirm their attendance"
            />
          </>
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
              message="This final step gives you the share link attendees will use. If the meet still has missing required information, fix those issues first and then come back here."
              onDismiss={onDismissHelpBanner || (() => undefined)}
            />
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
