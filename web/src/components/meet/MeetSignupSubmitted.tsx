import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import { GuestInput } from "../../types/GuestInput";

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
  guests?: GuestInput[];
  isOrganizationPrivate?: boolean;
  isPreview?: boolean;
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
  guests = [],
  isOrganizationPrivate = false,
  isPreview = false,
}: MeetSignupSubmittedProps) {
  const nav = useNavigate();
  const { isAuthenticated } = useAuth();
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
    shareCode && typeof window !== "undefined"
      ? `${window.location.origin}/meets/${shareCode}`
      : "";

  const handleCopyLink = async () => {
    if (!shareLink || !navigator.clipboard) return;
    await navigator.clipboard.writeText(shareLink);
  };

  const handleSendInvite = (guestName: string) => {
    if (!shareLink) return;
    const subject = encodeURIComponent("Meet invite");
    const body = encodeURIComponent(
      `Hi ${guestName || "there"},\n\nPlease use this link to sign up: ${shareLink}`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
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
            Application submitted
          </Typography>
          <Typography color="text.secondary">
            Your application has been submitted. You will be notified by the
            organizer when meet attendance has been finalized.
          </Typography>
          {isAuthenticated ? (
            <Tooltip
              title={
                isPreview ? "Can't show status in preview mode" : ""
              }
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
                {isOrganizationPrivate
                  ? "Use the link below to check the status of your application."
                  : "If you wish you can create a profile to make future meet signups faster and manage your applications. Alternatively just use the link below to check the status of your application."}
              </Typography>
              <Stack direction="row" spacing={2}>
                {!isOrganizationPrivate && (
                  <Button variant="contained" onClick={handleCreateProfile}>
                    Create Profile
                  </Button>
                )}
                <Tooltip
                  title={
                    isPreview ? "Can't show status in preview mode" : ""
                  }
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
          {guests.length > 0 && (
            <Stack spacing={1} sx={{ width: "100%", pt: 1 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                Guests
              </Typography>
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
                  {guest.isMinor ? (
                    <Typography variant="body2" color="text.secondary">
                      Sign indemnity
                    </Typography>
                  ) : (
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleSendInvite(guest.name)}
                        disabled={!shareLink}
                      >
                        Send invite
                      </Button>
                      <Button
                        size="small"
                        variant="text"
                        onClick={handleCopyLink}
                        disabled={!shareLink}
                      >
                        Copy link
                      </Button>
                    </Stack>
                  )}
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}
