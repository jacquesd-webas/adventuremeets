import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import MeetSignupSheet from "./MeetSignupSheet";
import { MeetInfoSummary } from "../components/meet/MeetInfoSummary";
import { AttendeeStatusAlert } from "../components/attendeeStatus/AttendeeStatusAlert";
import { useFetchMeetAttendeeStatus } from "../hooks/useFetchMeetAttendeeStatus";
import { useFetchMeetSignup } from "../hooks/useFetchMeetSignup";
import { MeetNotFound } from "../components/meet/MeetNotFound";
import { FullPageSpinner } from "../components/FullPageSpinner";
import { MeetSignupUserAction } from "../components/meet/MeetSignupUserAction";
import { useEffect, useState } from "react";
import { useFetchOrganization } from "../hooks/useFetchOrganization";
import { useThemeMode } from "../context/ThemeModeContext";
import { getOrganizationBackground } from "../helpers/organizationTheme";
import { ContactOrganizerDialog } from "../components/attendeeStatus/ContactOrganizerDialog";
import { WithdrawApplicationDialog } from "../components/attendeeStatus/WithdrawApplicationDialog";
import { VerifyAttendeeEmailDialog } from "../components/attendeeStatus/VerifyAttendeeEmailDialog";

export default function AttendeeStatusPage() {
  const { code, attendeeId } = useParams<{
    code: string;
    attendeeId: string;
  }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const action = searchParams.get("action");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);

  const {
    data: meet,
    isLoading: meetLoading,
    error: meetError,
  } = useFetchMeetSignup(code);
  const { data: organization } = useFetchOrganization(
    meet?.organizationId || undefined,
  );
  const { data: attendeeStatusData, isLoading: statusLoading } =
    useFetchMeetAttendeeStatus(code, attendeeId);
  const { mode } = useThemeMode();

  useEffect(() => {
    const previousBackgroundColor = document.body.style.backgroundColor;
    const previousBackgroundImage = document.body.style.backgroundImage;
    const previousOrgTheme = document.body.getAttribute("data-org-theme");
    const previousThemeBase = document.body.getAttribute("data-theme-base");

    const resolvedBase =
      mode === "glass"
        ? window.localStorage.getItem("themeBaseMode") || "light"
        : mode;
    const { image, color } = getOrganizationBackground(
      mode,
      organization?.theme,
    );
    document.body.style.backgroundColor = color;
    document.body.style.backgroundImage = `url("${image}")`;
    document.body.setAttribute("data-theme-base", resolvedBase);

    if (organization?.theme) {
      document.body.setAttribute("data-org-theme", organization.theme);
    } else {
      document.body.removeAttribute("data-org-theme");
    }

    return () => {
      document.body.style.backgroundColor = previousBackgroundColor;
      document.body.style.backgroundImage = previousBackgroundImage;
      if (previousOrgTheme) {
        document.body.setAttribute("data-org-theme", previousOrgTheme);
      } else {
        document.body.removeAttribute("data-org-theme");
      }
      if (previousThemeBase) {
        document.body.setAttribute("data-theme-base", previousThemeBase);
      } else {
        document.body.removeAttribute("data-theme-base");
      }
    };
  }, [mode, organization?.theme]);

  if (meetLoading || statusLoading) {
    return <FullPageSpinner />;
  }

  if (meetError || !meet) {
    return <MeetNotFound />;
  }

  if (action === "edit") {
    return <MeetSignupSheet />;
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

            <Typography variant="body1">
              You may choose to make changes to your application using any of
              the links below:
            </Typography>

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
                    setIsVerifyOpen(true);
                  }}
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

            <ContactOrganizerDialog
              open={isContactOpen}
              onClose={() => setIsContactOpen(false)}
              isMobile={isMobile}
              meet={meet}
            />

            <WithdrawApplicationDialog
              open={isWithdrawOpen}
              onClose={() => setIsWithdrawOpen(false)}
              meetId={meet.id}
              attendeeId={attendeeStatusData?.attendee.id}
              attendeeStatus={attendeeStatusData?.attendee.status}
            />

            <VerifyAttendeeEmailDialog
              open={isVerifyOpen}
              onClose={() => setIsVerifyOpen(false)}
              meetId={meet.id}
              attendeeId={attendeeStatusData?.attendee.id}
              onVerified={() => {
                if (!code || !attendeeId) return;
                navigate(`/meets/${code}/${attendeeId}?action=edit`);
              }}
            />
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
