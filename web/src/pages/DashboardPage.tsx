import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  Grid,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useOutletContext } from "react-router-dom";
import { Heading } from "../components/Heading";
import { useFetchMeets } from "../hooks/useFetchMeets";
import { useMeetStatusLookup } from "../hooks/useFetchMeetStatuses";
import Meet from "../types/MeetModel";
import MeetStatusEnum from "../types/MeetStatusEnum";
import { MeetActionsDialogs } from "../components/meet/MeetActionsDialogs";
import { MeetColumn } from "../components/dashboard/MeetColumn";
import { useCurrentOrganization } from "../context/organizationContext";
import { useFilters } from "../context/filterContext";
import { CreatePrivateOrganizationDialog } from "../components/auth/CreatePrivateOrganizationDialog";
import MeetActionsEnum from "../types/MeetActionsEnum";
import AddIcon from "@mui/icons-material/Add";
import { MainLayoutOutletContext } from "../layout/MainLayout";
import { useAuth } from "../context/authContext";
import { getMeetPermissions } from "../helpers/meetPermissions";

function DashboardPage() {
  const [selectedMeetId, setSelectedMeetId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<MeetActionsEnum | null>(
    null,
  );
  const [showCreateOrgDialog, setShowCreateOrgDialog] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(820));
  const { setMobileHeaderAction } = useOutletContext<MainLayoutOutletContext>();
  const { currentOrganizationId, currentOrganizationRole } =
    useCurrentOrganization();
  const { user } = useAuth();
  const { dashboardView, setDashboardView } = useFilters();
  const { data: meets, isLoading } = useFetchMeets({
    view: dashboardView,
    page: 1,
    limit: 50,
    organizationId: currentOrganizationId,
  });
  const { getName: getStatusName } = useMeetStatusLookup();
  const canManageMeets =
    currentOrganizationRole === "organizer" ||
    currentOrganizationRole === "admin";

  const handleNewMeet = useCallback(() => {
    if (!canManageMeets) {
      setShowCreateOrgDialog(true);
      return;
    }
    setPendingAction(MeetActionsEnum.Create);
  }, [canManageMeets, setPendingAction, setShowCreateOrgDialog]);

  useEffect(() => {
    if (!isMobile) {
      setMobileHeaderAction(null);
      return;
    }
    setMobileHeaderAction(
      <Button
        variant="text"
        color="inherit"
        size="small"
        startIcon={<AddIcon />}
        onClick={handleNewMeet}
        sx={{ textTransform: "none", whiteSpace: "nowrap", minWidth: 0, px: 1 }}
      >
        NEW MEET
      </Button>,
    );
    return () => setMobileHeaderAction(null);
  }, [handleNewMeet, isMobile, setMobileHeaderAction]);

  const { upcoming, past, draft, columns } = useMemo(() => {
    const now = new Date();
    const draftMeets: Meet[] = meets.filter(
      (m: Meet) => m.statusId === MeetStatusEnum.Draft,
    );
    const upcomingMeets: Meet[] = meets.filter(
      (m: Meet) =>
        m.statusId !== MeetStatusEnum.Draft &&
        m.endTime &&
        new Date(m.endTime) >= now,
    );
    const pastMeets: Meet[] = meets.filter(
      (m: Meet) =>
        m.statusId !== MeetStatusEnum.Draft &&
        m.endTime &&
        new Date(m.endTime) < now,
    );
    let numColumns = 1; // We always show upcoming
    if (draftMeets.length > 0) numColumns++;
    if (pastMeets.length > 0) numColumns++;
    return {
      upcoming: upcomingMeets,
      past: pastMeets,
      draft: draftMeets,
      columns: numColumns,
    };
  }, [meets]);

  const selectedMeetPermissions = useMemo(() => {
    if (pendingAction === MeetActionsEnum.Create) {
      return {
        isOrganizerForMeet: true,
        canManageMeet: true,
        canViewMeet: false,
      };
    }

    const selectedMeet = meets.find((meet) => meet.id === selectedMeetId);
    if (!selectedMeet) {
      return {
        isOrganizerForMeet: false,
        canManageMeet: false,
        canViewMeet: false,
      };
    }

    return getMeetPermissions({
      currentUserId: user?.id,
      currentOrganizationRole,
      organizerId: selectedMeet.organizerId,
    });
  }, [currentOrganizationRole, meets, pendingAction, selectedMeetId, user?.id]);

  return (
    <Container
      maxWidth="lg"
      disableGutters={isMobile}
      sx={{
        pt: 1,
        pb: 4,
        height: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        px: isMobile ? 1 : 0,
      }}
    >
      <Heading
        title="Dashboard"
        subtitle="View upcoming and past meets that you are organising or attending."
        actionComponent={
          !isMobile ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <ToggleButtonGroup
                exclusive
                size="small"
                value={dashboardView}
                onChange={(_event, nextView) => {
                  if (nextView) setDashboardView(nextView);
                }}
              >
                <ToggleButton value="my">My meets</ToggleButton>
                <ToggleButton value="all">All meets</ToggleButton>
              </ToggleButtonGroup>
              <Button variant="contained" onClick={handleNewMeet}>
                New Meet
              </Button>
            </Stack>
          ) : (
            <ToggleButtonGroup
              exclusive
              size="small"
              value={dashboardView}
              onChange={(_event, nextView) => {
                if (nextView) setDashboardView(nextView);
              }}
              sx={{
                "& .MuiToggleButton-root": {
                  minWidth: 0,
                  px: 1,
                  py: 0.25,
                  fontSize: "0.7rem",
                  lineHeight: 1.2,
                },
              }}
            >
              <ToggleButton value="my">My Meets</ToggleButton>
              <ToggleButton value="all">All Meets</ToggleButton>
            </ToggleButtonGroup>
          )
        }
      />

      <Box sx={{ flex: 1, overflowY: "auto", pr: isMobile ? 0 : 1 }}>
        <Grid container spacing={3}>
          {draft && draft.length > 0 && (
            <Grid item xs={12} md={12 / columns}>
              <MeetColumn
                title="Draft Meets"
                meets={draft}
                statusFallback="Draft"
                currentUserId={user?.id}
                currentOrganizationRole={currentOrganizationRole}
                getStatusLabel={getStatusName}
                setSelectedMeetId={setSelectedMeetId}
                setPendingAction={setPendingAction}
                isLoading={isLoading}
              />
            </Grid>
          )}

          <Grid item xs={12} md={12 / columns}>
            <MeetColumn
              title="Upcoming Meets"
              meets={upcoming as Meet[]}
              statusFallback="Scheduled"
              currentUserId={user?.id}
              currentOrganizationRole={currentOrganizationRole}
              getStatusLabel={getStatusName}
              setSelectedMeetId={setSelectedMeetId}
              setPendingAction={setPendingAction}
              isLoading={isLoading}
            />
          </Grid>
          {past && past.length > 0 && (
            <Grid item xs={12} md={12 / columns}>
              <MeetColumn
                title="Past Meets"
                meets={past as Meet[]}
                statusFallback="Closed"
                currentUserId={user?.id}
                currentOrganizationRole={currentOrganizationRole}
                getStatusLabel={getStatusName}
                setSelectedMeetId={setSelectedMeetId}
                setPendingAction={setPendingAction}
                isLoading={isLoading}
              />
            </Grid>
          )}
        </Grid>
      </Box>
      {canManageMeets ? (
        <MeetActionsDialogs
          meetId={selectedMeetId || null}
          canViewMeet={selectedMeetPermissions.canViewMeet}
          canManageMeet={selectedMeetPermissions.canManageMeet}
          isOrganizer={selectedMeetPermissions.isOrganizerForMeet}
          pendingAction={pendingAction || undefined}
          setPendingAction={setPendingAction}
          setSelectedMeetId={setSelectedMeetId}
        />
      ) : (
        <CreatePrivateOrganizationDialog
          open={showCreateOrgDialog}
          onClose={() => setShowCreateOrgDialog(false)}
        />
      )}
    </Container>
  );
}

export default DashboardPage;
