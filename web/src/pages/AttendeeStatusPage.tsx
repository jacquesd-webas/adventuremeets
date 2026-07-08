import {
  Box,
  Container,
  IconButton,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import MeetSignupSheet from "./MeetSignupSheet";
import { MeetInfoSummary } from "../components/meet/MeetInfoSummary";
import { AttendeeStatusActions } from "../components/attendeeStatus/AttendeeStatusActions";
import { useFetchMeetAttendeeStatus } from "../hooks/useFetchMeetAttendeeStatus";
import { useFetchMeetSignup } from "../hooks/useFetchMeetSignup";
import { MeetNotFound } from "../components/meet/MeetNotFound";
import { FullPageSpinner } from "../components/FullPageSpinner";
import { Suspense, lazy, useEffect } from "react";
import { useFetchOrganization } from "../hooks/useFetchOrganization";
import { useThemeMode } from "../context/ThemeModeContext";
import { getOrganizationBackground } from "../helpers/organizationTheme";
import { MeetStatusEnum } from "../types/MeetStatusEnum";
import AttendeeStatusEnum from "../types/AttendeeStatusEnum";

const MeetWall = lazy(() =>
  import("../components/wall/MeetWall").then((module) => ({
    default: module.default ?? module.MeetWall,
  })),
);

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

  const meetHasStarted =
    !!meet.startTime &&
    !Number.isNaN(new Date(meet.startTime).getTime()) &&
    new Date(meet.startTime).getTime() <= Date.now();

  const shouldShowMeetWall =
    meet.statusId === MeetStatusEnum.Completed ||
    (meet.statusId === MeetStatusEnum.Closed && meetHasStarted);
  const shouldShowAttendingAttendees = [
    AttendeeStatusEnum.Confirmed,
    AttendeeStatusEnum.CheckedIn,
    AttendeeStatusEnum.Attended,
  ].includes(attendeeStatusData?.attendee?.status ?? AttendeeStatusEnum.Pending);

  return (
    <Box sx={{ height: "100vh", position: "relative" }}>
      <Container
        maxWidth={isMobile ? false : "md"}
        disableGutters={isMobile}
        sx={{
          py: isMobile ? 0 : 6,
          pt: isMobile ? 0 : 6,
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
            height: "100%",
            minHeight: "100%",
            borderRadius: isMobile ? 0 : 2,
            boxShadow: isMobile ? "none" : undefined,
          }}
        >
          <Stack spacing={1.5}>
            <MeetInfoSummary
              meet={meet}
              isPreview={false}
              maxDescriptionLines={meet.imageUrl ? 6 : 9}
              attendingAttendees={
                shouldShowAttendingAttendees
                  ? attendeeStatusData?.attendingAttendees
                  : []
              }
              showUserAction={false}
              actionSlot={
                <IconButton
                  data-testid="close-attendee-status"
                  onClick={() => navigate("/")}
                  size="small"
                  aria-label="Back to dashboard"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              }
            />

            {shouldShowMeetWall ? (
              <Suspense
                fallback={
                  <Typography color="text.secondary">Loading meet wall...</Typography>
                }
              >
                <MeetWall
                  meetId={meet.id}
                  attendeeId={attendeeStatusData?.attendee.id}
                />
              </Suspense>
            ) : (
              <AttendeeStatusActions
                meet={meet}
                meetCode={code}
                attendeeId={attendeeStatusData?.attendee.id}
                attendeeStatus={attendeeStatusData?.attendee.status}
              />
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
