import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/authContext";
import { GuestInput } from "../../types/GuestInput";
import { useCopyMyMetaValuesFromAttendee } from "../../hooks/useCopyMyMetaValuesFromAttendee";
import { useNotistack } from "../../hooks/useNotistack";
import { getMeetResponseWording } from "../../helpers/meetResponseWording";

type MeetSignupSubmittedProps = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneCountry?: string;
  phoneLocal?: string;
  organizationId?: string;
  meetId?: string;
  attendeeId?: string;
  shareCode?: string;
  hasIndemnity: boolean;
  hasPdfIndemnityTemplate?: boolean;
  namedGuests?: boolean;
  guests?: GuestInput[];
  isMinor?: boolean;
  isGuest?: boolean;
  isOrganizationPrivate?: boolean;
  isPreview?: boolean;
  isRsvpMode?: boolean;
};

export function MeetSignupSubmitted({
  firstName,
  lastName,
  email,
  phoneCountry,
  phoneLocal,
  organizationId,
  meetId,
  attendeeId,
  shareCode,
  hasIndemnity,
  hasPdfIndemnityTemplate = false,
  namedGuests = false,
  isMinor = false,
  isGuest = false,
  guests = [],
  isOrganizationPrivate = false,
  isPreview = false,
  isRsvpMode = false,
}: MeetSignupSubmittedProps) {
  const wording = getMeetResponseWording(isRsvpMode);
  const nav = useNavigate();
  const { isAuthenticated } = useAuth();
  const notice = useNotistack();
  const [rememberAnswers, setRememberAnswers] = useState(false);
  const [rememberAnswersSaved, setRememberAnswersSaved] = useState(false);
  const { copyMyMetaValuesFromAttendeeAsync, isLoading: isCopying } =
    useCopyMyMetaValuesFromAttendee();

  const handleCreateProfile = () => {
    nav("/register", {
      state: {
        firstName,
        lastName,
        email,
        phoneCountry,
        phoneLocal,
        organizationId,
        meetId,
        shareCode,
        attendeeId,
      },
    });
  };

  const handleShowStatus = () => {
    if (!shareCode || !attendeeId) return;
    nav(`/meets/${shareCode}/${attendeeId}`);
  };

  const shareLink =
    shareCode && attendeeId && typeof window !== "undefined"
      ? `${window.location.origin}/meets/${shareCode}?guestOf=${attendeeId}`
      : "";

  const getGuestInviteLink = (guestName: string) => {
    if (!shareLink || !guestName.trim()) return shareLink;
    const url = new URL(shareLink);
    url.searchParams.set("name", guestName.trim());
    return url.toString();
  };

  const handleCopyLink = async (guestName: string) => {
    if (!shareLink || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(getGuestInviteLink(guestName));
      notice.success("Guest invite link copied");
    } catch {
      notice.error("Unable to copy guest invite link");
    }
  };

  const handleSignIndemnity = (guestName: string) => {
    if (!shareLink) return;
    const url = new URL(shareLink);
    url.searchParams.set("name", guestName);
    url.searchParams.set("isMinor", "true");
    url.searchParams.set("email", email || "");
    url.searchParams.set("phoneCountry", phoneCountry || "");
    url.searchParams.set("phoneLocal", phoneLocal || "");
    nav(url.pathname + url.search);
  };

  const getSendInviteHref = (guestName: string) => {
    const subject = encodeURIComponent("Meet invite");
    const body = encodeURIComponent(
      `Hi ${guestName || "there"},\n\n${wording.minorInviteMessage}: ${getGuestInviteLink(guestName)}`,
    );
    return `mailto:?subject=${subject}&body=${body}`;
  };

  const canRememberAnswers =
    isAuthenticated &&
    !isGuest &&
    !isMinor &&
    !isPreview &&
    Boolean(meetId && attendeeId);

  const handleRememberAnswersChange = async (checked: boolean) => {
    if (!checked || !meetId || !attendeeId) {
      setRememberAnswers(false);
      return;
    }

    setRememberAnswers(true);
    try {
      await copyMyMetaValuesFromAttendeeAsync({ meetId, attendeeId });
      setRememberAnswersSaved(true);
      notice.success("Answers saved for future signups");
    } catch (err: any) {
      setRememberAnswers(false);
      setRememberAnswersSaved(false);
      notice.error(err?.message || "Unable to save answers");
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2} alignItems="center" textAlign="center">
          <Box
            sx={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              bgcolor: "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircleIcon sx={{ color: "#ffffff", fontSize: 64 }} />
          </Box>
          <Typography variant="h5" fontWeight={700}>
            {wording.submittedTitle}
          </Typography>
          <Typography color="text.secondary">
            {wording.submittedBody}
          </Typography>
          {canRememberAnswers ? (
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberAnswers}
                  disabled={isCopying || rememberAnswersSaved}
                  onChange={(event) =>
                    void handleRememberAnswersChange(event.target.checked)
                  }
                />
              }
              label="Remember my answers"
              sx={{ alignSelf: "center", m: 0 }}
            />
          ) : null}
          {isAuthenticated ? (
            <Tooltip
              title={isPreview ? "Can't show status in preview mode" : ""}
              disableHoverListener={!isPreview}
            >
              <span>
                <Button
                  variant="contained"
                  onClick={handleShowStatus}
                  disabled={!shareCode || !attendeeId || isPreview}
                >
                  Show Status
                </Button>
              </span>
            </Tooltip>
          ) : (
            <>
              <Typography color="text.secondary">
                {isOrganizationPrivate || isGuest
                  ? wording.withdrawalStatusLead
                  : wording.withdrawalStatusLeadWithProfile}
              </Typography>
              <Stack direction="row" spacing={2}>
                {!isOrganizationPrivate && !isGuest && (
                  <Button variant="contained" onClick={handleCreateProfile}>
                    Create Profile
                  </Button>
                )}
                <Tooltip
                  title={isPreview ? "Can't show status in preview mode" : ""}
                  disableHoverListener={!isPreview}
                >
                  <span>
                    <Button
                      variant="outlined"
                      onClick={handleShowStatus}
                      disabled={isPreview}
                    >
                      Show Status
                    </Button>
                  </span>
                </Tooltip>
              </Stack>
            </>
          )}
          {guests.length > 0 && (namedGuests || hasIndemnity) && (
            <Box sx={{ width: "100%", pt: 1, textAlign: "left" }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Guest Information
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You may optionally send your guests an invite link so that they
                also receive notifications about the meet.
              </Typography>
              {hasIndemnity && (
                <Typography variant="body2" color="text.secondary">
                  Bear in mind that this meet does require indemnity to be
                  accepted, so check with the organiser if you need your guests
                  to fill in the form.
                </Typography>
              )}
              <Stack spacing={1} sx={{ width: "100%", pt: 1 }}>
                {guests.map((guest, index) => (
                  <Stack
                    key={`${guest.name || "guest"}-${index}`}
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    justifyContent="space-between"
                    sx={{
                      width: "100%",
                      p: 1.5,
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      {guest.name || `Guest ${index + 1}`}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      {guest.isMinor &&
                        hasIndemnity &&
                        !hasPdfIndemnityTemplate && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleSignIndemnity(guest.name)}
                            disabled={!shareLink}
                          >
                            Sign indemnity
                          </Button>
                        )}
                      <Button
                        component="a"
                        size="small"
                        variant="outlined"
                        href={
                          shareLink ? getSendInviteHref(guest.name) : undefined
                        }
                        disabled={!shareLink}
                      >
                        Send invite
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => void handleCopyLink(guest.name)}
                        disabled={!shareLink}
                      >
                        Copy link
                      </Button>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}
