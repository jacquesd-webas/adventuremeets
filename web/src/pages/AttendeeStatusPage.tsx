import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  Link,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import { useParams } from "react-router-dom";
import { MeetInfoSummary } from "../components/MeetInfoSummary";
import { AttendeeStatusAlert } from "../components/AttendeeStatusAlert";
import { useFetchMeetAttendeeStatus } from "../hooks/useFetchMeetAttendeeStatus";
import { useAuth } from "../context/authContext";
import { useFetchMeetSignup } from "../hooks/useFetchMeetSignup";
import { MeetNotFound } from "../components/MeetNotFound";
import { FullPageSpinner } from "../components/FullPageSpinner";
import { MeetSignupUserAction } from "../components/MeetSignupUserAction";
import { ConfirmActionDialog } from "../components/ConfirmActionDialog";
import { useApi } from "../hooks/useApi";
import { useNotistack } from "../hooks/useNotistack";
import { useState } from "react";

export default function AttendeeStatusPage() {
  const { code, attendeeId } = useParams<{
    code: string;
    attendeeId: string;
  }>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { isAuthenticated } = useAuth();
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const api = useApi();
  const { error, success } = useNotistack();

  const {
    data: meet,
    isLoading: meetLoading,
    error: meetError,
  } = useFetchMeetSignup(code);
  const {
    data: attendeeStatusData,
    isLoading: statusLoading,
    refetch: refetchAttendeeStatus,
  } = useFetchMeetAttendeeStatus(code, attendeeId);

  const handleWithdraw = async () => {
    if (!code || !attendeeId) return;
    setIsWithdrawing(true);
    try {
      await api.patch(`/meets/${code}/attendeeStatus/${attendeeId}`);
      await refetchAttendeeStatus();
      success("Application withdrawn");
      setIsWithdrawOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error(`Unable to withdraw application: ${message}`);
    } finally {
      setIsWithdrawing(false);
    }
  };

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
                direction={isMobile ? "column" : "row"}
                spacing={2}
                alignItems="center"
                justifyContent="center"
                sx={isMobile ? { width: "100%" } : undefined}
              >
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => {
                    alert("Not implemented yet!");
                  }}
                  disabled={!isAuthenticated}
                  fullWidth={isMobile}
                >
                  Edit Application
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => {
                    setIsWithdrawOpen(true);
                  }}
                  disabled={
                    !isAuthenticated ||
                    !["pending", "confirmed"].includes(
                      attendeeStatusData?.attendee.status || ""
                    )
                  }
                  fullWidth={isMobile}
                >
                  Withdraw Application
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => {
                    setIsContactOpen(true);
                  }}
                  fullWidth={isMobile}
                >
                  Contact Organiser
                </Button>
              </Stack>
            </Box>

            {isMobile ? (
              <Drawer
                anchor="bottom"
                open={isContactOpen}
                onClose={() => setIsContactOpen(false)}
              >
                <Box sx={{ p: 2 }}>
                  <Stack spacing={1.5}>
                    <Typography variant="subtitle1">
                      Contact Organiser
                    </Typography>
                    <Stack spacing={1}>
                      <Typography variant="body1" fontWeight="bold">
                        {meet.organizerName || "Organizer"}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <EmailOutlinedIcon fontSize="small" />
                        {meet.organizerEmail ? (
                          <Link
                            href={`mailto:${meet.organizerEmail}`}
                            variant="body2"
                            underline="hover"
                          >
                            {meet.organizerEmail}
                          </Link>
                        ) : (
                          <Typography variant="body2">Not available</Typography>
                        )}
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PhoneOutlinedIcon fontSize="small" />
                        {meet.organizerPhone ? (
                          <Link
                            href={`tel:${meet.organizerPhone}`}
                            variant="body2"
                            underline="hover"
                          >
                            {meet.organizerPhone}
                          </Link>
                        ) : (
                          <Typography variant="body2">Not available</Typography>
                        )}
                      </Stack>
                    </Stack>
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                      <Button onClick={() => setIsContactOpen(false)}>
                        Close
                      </Button>
                    </Box>
                  </Stack>
                </Box>
              </Drawer>
            ) : (
              <Dialog
                open={isContactOpen}
                onClose={() => setIsContactOpen(false)}
                fullWidth
                maxWidth="sm"
              >
                <DialogTitle>Contact Organiser</DialogTitle>
                <DialogContent dividers>
                  <Stack spacing={1}>
                    <Typography variant="body1" fontWeight="bold">
                      {meet.organizerName || "Organizer"}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <EmailOutlinedIcon fontSize="small" />
                      {meet.organizerEmail ? (
                        <Link
                          href={`mailto:${meet.organizerEmail}`}
                          variant="body2"
                          underline="hover"
                        >
                          {meet.organizerEmail}
                        </Link>
                      ) : (
                        <Typography variant="body2">Not available</Typography>
                      )}
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PhoneOutlinedIcon fontSize="small" />
                      {meet.organizerPhone ? (
                        <Link
                          href={`tel:${meet.organizerPhone}`}
                          variant="body2"
                          underline="hover"
                        >
                          {meet.organizerPhone}
                        </Link>
                      ) : (
                        <Typography variant="body2">Not available</Typography>
                      )}
                    </Stack>
                  </Stack>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setIsContactOpen(false)}>Close</Button>
                </DialogActions>
              </Dialog>
            )}

            <ConfirmActionDialog
              open={isWithdrawOpen}
              title="Withdraw application?"
              description="Withdrawing will mark your application as cancelled."
              confirmLabel="Withdraw application"
              onConfirm={handleWithdraw}
              onClose={() => setIsWithdrawOpen(false)}
              isSubmitting={isWithdrawing}
            />

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
