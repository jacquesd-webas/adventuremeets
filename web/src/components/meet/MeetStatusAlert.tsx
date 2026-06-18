import { Alert, Box, Button, Typography } from "@mui/material";
import { MeetStatusEnum } from "../../types/MeetStatusEnum";
import { formatFriendlyTimestamp } from "../../helpers/formatFriendlyTimestamp";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import { useFetchMyMeetAttendee } from "../../hooks/useFetchMyMeetAttendee";
import { getMeetResponseWording } from "../../helpers/meetResponseWording";

type MeetStatusAlertProps = {
  meetId?: string;
  statusId?: number;
  openingDate?: string | Date;
  enableApply?: boolean;
  shareCode?: string;
  allowGuests?: boolean;
  isRsvpMode?: boolean;
  size?: "default" | "small";
};

export function MeetStatusAlert({
  meetId,
  statusId,
  openingDate,
  enableApply,
  shareCode,
  allowGuests = false,
  isRsvpMode = false,
  size = "default",
}: MeetStatusAlertProps) {
  const wording = getMeetResponseWording(isRsvpMode);
  const nav = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { attendee, isLoading: isCheckingAttendee } = useFetchMyMeetAttendee({
    meetId,
    email: user?.email,
    phone: user?.phone,
    enabled: Boolean(
      enableApply && statusId === MeetStatusEnum.Open && isAuthenticated,
    ),
  });
  let text = "";
  let severity: "info" | "warning" | "success" | "error" = "info";

  if (statusId === MeetStatusEnum.Published) {
    const openLabel = openingDate ? formatFriendlyTimestamp(openingDate) : "";
    text = openLabel
      ? `This meet is not yet open for bookings. Bookings open ${openLabel}.`
      : "This meet is not yet open for bookings.";
    severity = "warning";
  } else if (statusId === MeetStatusEnum.Closed) {
    text = "This meet is closed and no longer accepting bookings.";
    severity = "warning";
  } else if (statusId === MeetStatusEnum.Cancelled) {
    text = "This meet has been cancelled.";
    severity = "error";
  } else if (statusId === MeetStatusEnum.Postponed) {
    text = "This meet has been postponed. Please check back later for updates.";
    severity = "warning";
  } else if (statusId === MeetStatusEnum.Completed) {
    text = "This meet has been archived and is no longer accepting bookings.";
    severity = "info";
  } else if (statusId === MeetStatusEnum.Open && enableApply && !attendee) {
    text = "This meet is open for bookings!";
    severity = "success";
  } else if (attendee) {
    text = wording.alreadySubmittedLabel;
    severity = "success";
  } else {
    return null;
  }

  return (
    <Box p={size === "small" ? 2.5 : 5}>
      <Alert
        severity={severity}
        icon={false}
        sx={{
          py: size === "small" ? 3 : 6,
          fontWeight: 700,
          textAlign: "center",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {enableApply && statusId === MeetStatusEnum.Open ? (
          <>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {text}
            </Typography>
            {attendee ? (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ ml: 2 }}
                  onClick={() => {
                    nav(`/meets/${shareCode}/${attendee.id}`);
                  }}
                  disabled={!shareCode}
                >
                  {wording.viewLabel}
                </Button>
                {allowGuests ? (
                  <Button
                    variant="outlined"
                    color="primary"
                    sx={{ ml: 2 }}
                    onClick={() => {
                      nav(
                        `/meets/${shareCode}?guestOf=${attendee.id}&isMinor=true`,
                      );
                    }}
                    disabled={!shareCode}
                  >
                    Sign up minor guest
                  </Button>
                ) : null}
              </>
            ) : isCheckingAttendee ? null : (
              <Button
                variant="contained"
                color="primary"
                sx={{ ml: 2 }}
                onClick={() => {
                  nav(`/meets/${shareCode}`);
                }}
                disabled={!shareCode}
              >
                {wording.actionNowLabel}
              </Button>
            )}
          </>
        ) : (
          <Typography variant="body1">{text}</Typography>
        )}
      </Alert>
    </Box>
  );
}
