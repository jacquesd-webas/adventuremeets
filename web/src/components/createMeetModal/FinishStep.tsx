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
import { getMeetDateLabel, getMeetTimeLabel } from "../../helpers/meetTime";
import { openMeetPosterPrintWindow } from "./openMeetPosterPrintWindow";
import Meet from "../../types/MeetModel";

type FinishStepProps = StepProps & {
  shareCode?: string | null;
  checkinPin?: string | null;
  isEditing?: boolean;
  onPreview?: () => void;
};

export function FinishStep({
  state,
  setState,
  errors = [],
  shareCode,
  checkinPin,
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

  const selfCheckinUrl = useMemo(() => {
    if (!shareCode || !checkinPin) return "";
    const params = new URLSearchParams({ pin: checkinPin });
    if (typeof window === "undefined") {
      return `/meets/${shareCode}/checkin?${params.toString()}`;
    }
    return `${window.location.origin}/meets/${shareCode}/checkin?${params.toString()}`;
  }, [checkinPin, shareCode]);

  const posterSubtitle = useMemo(() => {
    const posterMeet: Meet = {
      id: "poster-preview",
      name: state.name || "Meet",
      organizerId: state.organizerId || "poster-organizer",
      startTime: state.startTime,
      endTime: state.endTime,
      startTimeTbc: state.startTimeTbc,
      endTimeTbc: state.endTimeTbc,
    };
    const dateLabel = getMeetDateLabel(posterMeet);
    const timeLabel = getMeetTimeLabel(posterMeet);

    if (!timeLabel || timeLabel === "TBC") {
      return dateLabel;
    }

    return `${dateLabel} • ${timeLabel}`;
  }, [state.endTime, state.endTimeTbc, state.startTime, state.startTimeTbc]);

  const handleCopy = async () => {
    if (!shareUrl || typeof navigator === "undefined") return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintSignupPoster = () => {
    if (!shareUrl) return;
    openMeetPosterPrintWindow({
      title: state.name || "Meet signup",
      subtitle: posterSubtitle,
      qrUrl: shareUrl,
      imageUrl: state.imagePreview || undefined,
      footerLabel: "Meet signup",
    });
  };

  const handlePrintSelfCheckinPoster = () => {
    if (!selfCheckinUrl) return;
    openMeetPosterPrintWindow({
      title: state.name || "Meet self check-in",
      subtitle: posterSubtitle,
      qrUrl: selfCheckinUrl,
      imageUrl: state.imagePreview || undefined,
      footerLabel: "Self check-in",
    });
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
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              alignItems="center"
            >
              <Button
                variant="outlined"
                onClick={onPreview}
                disabled={typeof onPreview !== "function" || !previewUrl}
              >
                Preview
              </Button>
              <Button
                variant="outlined"
                onClick={handlePrintSignupPoster}
                disabled={!shareUrl}
              >
                Sign-up Poster
              </Button>
              {state.allowSelfCheckin ? (
                <Button
                  variant="outlined"
                  onClick={handlePrintSelfCheckinPoster}
                  disabled={!selfCheckinUrl}
                >
                  Check-in Poster
                </Button>
              ) : null}
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
              message={
                <>
                  This is the final step before you publish you meet. Here you
                  can preview what your meet will look to applicants.
                  <br />
                  <br />
                  Fix any issues you see before you publish the meet. Then use
                  the link to advertise your meet using whatever method you
                  like.
                </>
              }
              onDismiss={onDismissHelpBanner || (() => undefined)}
            />
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
