import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { MeetInfoSummary } from "../components/MeetInfoSummary";
import { AttendeeStatusAlert } from "../components/AttendeeStatusAlert";
import { useFetchMeetAttendeeStatus } from "../hooks/useFetchMeetAttendeeStatus";
import { useAuth } from "../context/AuthContext";
import { useFetchMeetSignup } from "../hooks/useFetchMeetSignup";
import { MeetNotFound } from "../components/MeetNotFound";
import { FullPageSpinner } from "../components/FullPageSpinner";
import { MeetSignupUserAction } from "../components/MeetSignupUserAction";
import { useRef, useState } from "react";

export default function AttendeeStatusPage() {
  const { code, attendeeId } = useParams<{
    code: string;
    attendeeId: string;
  }>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { user, isAuthenticated, logout } = useAuth();
  const signOutTriggered = useRef(false);

  const {
    data: meet,
    isLoading: meetLoading,
    error: meetError,
  } = useFetchMeetSignup(code);
  const { data: attendeeStatusData, isLoading: statusLoading } =
    useFetchMeetAttendeeStatus(code, attendeeId);

  if (meetLoading || statusLoading) {
    return <FullPageSpinner />;
  }

  if (meetError || !meet) {
    return <MeetNotFound />;
  }

  return (
    <Box sx={{ height: "100vh", position: "relative" }}>
      <Container
        maxWidth={isMobile ? false : "md"}
        disableGutters={isMobile}
        sx={{
          py: isMobile ? 0 : 6,
          pt: isMobile ? 2 : 6,
          minHeight: "100vh",
          height: "100%",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            p: isMobile ? 2 : 3,
            minHeight: "100%",
            borderRadius: isMobile ? 0 : 2,
            boxShadow: isMobile ? "none" : undefined,
          }}
        >
          <Stack spacing={1.5}>
            <MeetInfoSummary
              meet={meet}
              isPreview={false}
              descriptionMaxLines={meet.imageUrl ? 6 : 9}
              showMoreChip
              showUserAction={false}
              actionSlot={
                <MeetSignupUserAction
                  formEmail={attendeeStatusData?.attendee.email}
                />
              }
            />
            <AttendeeStatusAlert status={attendeeStatusData?.attendee.status} />

            {isAuthenticated && (
              <Typography variant="body1">
                You may choose to make changes to your application using any of
                the links below:
              </Typography>
            )}

            {!isAuthenticated && (
              <Typography variant="body1">
                To make changes to your application, please log in using the
                button at the top right of the page. If you do not have a
                profile and wish to make changes to your application please
                contact the organiser of the meet.
              </Typography>
            )}

            <Box sx={{ width: "100%" }}>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                justifyContent="center"
              >
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => {
                    alert("Not implemented yet!");
                  }}
                  disabled={!isAuthenticated}
                >
                  Edit Application
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => {
                    alert("Not implemented yet!");
                  }}
                  disabled={!isAuthenticated}
                >
                  Withdraw Application
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => {
                    alert("Not implemented yet!");
                  }}
                >
                  Contact Organiser
                </Button>
              </Stack>
            </Box>

            {/*
                <MeetSignupFormFields
                  meet={meet}
                  fullName={fullName}
                  email={email}
                  phoneCountry={phoneCountry}
                  phoneLocal={phoneLocal}
                  wantsGuests={wantsGuests}
                  guestCount={guestCount}
                  metaValues={metaValues}
                  indemnityAccepted={indemnityAccepted}
                  isSubmitDisabled={isSubmitDisabled}
                  isSubmitting={isSubmitting}
                  onSubmit={handleSubmit}
                  onCheckDuplicate={checkForDuplicate}
                  setField={setField}
                  setMetaValue={setMetaValue}
                  setPhoneCountry={setPhoneCountry}
                  setPhoneLocal={setPhoneLocal}
                />
              */}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
  /*return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {meet.name}
            </Typography>
            {meet.location && (
              <Typography variant="body2" color="text.secondary">
                {meet.location}
              </Typography>
            )}
            {timeLabel && (
              <Typography variant="body2" color="text.secondary">
                {timeLabel}
              </Typography>
            )}
          </Box>

          <Box>
            <Typography variant="subtitle2" fontWeight={700}>
              Attendee
            </Typography>
            <Typography variant="body1">
              {attendee.name || attendee.email || attendee.phone || "Attendee"}
            </Typography>
            {typeof attendee.guests === "number" && attendee.guests > 0 ? (
              <Typography variant="body2" color="text.secondary">
                Guests: {attendee.guests}
              </Typography>
            ) : null}
          </Box>

          <AttendeeStatusAlert status={attendee.status} />
        </Stack>
      </Paper>
    </Container>
  );*/
}
