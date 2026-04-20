import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useInfiniteFetchMeets } from "../hooks/useInfiniteFetchMeets";
import { useMeetStatusLookup } from "../hooks/useFetchMeetStatuses";
import Meet from "../types/MeetModel";
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

const DASHBOARD_PAGE_SIZE = 5;

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
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const draftQuery = useInfiniteFetchMeets({
    view: "draft",
    scope: dashboardView,
    limit: DASHBOARD_PAGE_SIZE,
    organizationId: currentOrganizationId,
  });
  const upcomingQuery = useInfiniteFetchMeets({
    view: "upcoming",
    scope: dashboardView,
    limit: DASHBOARD_PAGE_SIZE,
    organizationId: currentOrganizationId,
  });
  const pastQuery = useInfiniteFetchMeets({
    view: "past",
    scope: dashboardView,
    limit: DASHBOARD_PAGE_SIZE,
    organizationId: currentOrganizationId,
  });
  const { getName: getStatusName } = useMeetStatusLookup();
  const canManageMeets =
    currentOrganizationRole === "organizer" ||
    currentOrganizationRole === "admin";
  const draft = draftQuery.data;
  const upcoming = upcomingQuery.data;
  const past = pastQuery.data;
  const draftHasNextPage = Boolean(draftQuery.hasNextPage);
  const upcomingHasNextPage = Boolean(upcomingQuery.hasNextPage);
  const pastHasNextPage = Boolean(pastQuery.hasNextPage);
  const fetchNextDraftPage = draftQuery.fetchNextPage;
  const fetchNextUpcomingPage = upcomingQuery.fetchNextPage;
  const fetchNextPastPage = pastQuery.fetchNextPage;
  const allMeets = useMemo(
    () => [...draft, ...upcoming, ...past],
    [draft, past, upcoming],
  );
  const isAnyFetchingNextPage =
    draftQuery.isFetchingNextPage ||
    upcomingQuery.isFetchingNextPage ||
    pastQuery.isFetchingNextPage;
  const hasAnyNextPage =
    draftHasNextPage || upcomingHasNextPage || pastHasNextPage;

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

  const columns = useMemo(() => {
    let numColumns = 1; // We always show upcoming
    if (draft.length > 0 || draftQuery.isLoading) numColumns++;
    if (past.length > 0 || pastQuery.isLoading) numColumns++;
    return numColumns;
  }, [draft.length, draftQuery.isLoading, past.length, pastQuery.isLoading]);

  const fetchMoreColumns = useCallback(async () => {
    const requests: Array<Promise<unknown>> = [];

    if (draftHasNextPage) {
      requests.push(fetchNextDraftPage());
    }
    if (upcomingHasNextPage) {
      requests.push(fetchNextUpcomingPage());
    }
    if (pastHasNextPage) {
      requests.push(fetchNextPastPage());
    }

    if (!requests.length) {
      return;
    }

    await Promise.all(requests);
  }, [
    draftHasNextPage,
    fetchNextDraftPage,
    fetchNextPastPage,
    fetchNextUpcomingPage,
    pastHasNextPage,
    upcomingHasNextPage,
  ]);

  useEffect(() => {
    const root = scrollContainerRef.current;
    const target = loadMoreRef.current;

    if (!root || !target || !hasAnyNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || isAnyFetchingNextPage) {
          return;
        }
        void fetchMoreColumns();
      },
      {
        root,
        rootMargin: "200px 0px",
        threshold: 0.1,
      },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchMoreColumns, hasAnyNextPage, isAnyFetchingNextPage]);

  const selectedMeetPermissions = useMemo(() => {
    if (pendingAction === MeetActionsEnum.Create) {
      return {
        isOrganizerForMeet: true,
        canManageMeet: true,
        canViewMeet: false,
      };
    }

    const selectedMeet = allMeets.find((meet) => meet.id === selectedMeetId);
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
  }, [
    allMeets,
    currentOrganizationRole,
    pendingAction,
    selectedMeetId,
    user?.id,
  ]);

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

      <Box
        ref={scrollContainerRef}
        sx={{ flex: 1, overflowY: "auto", pr: isMobile ? 0 : 1 }}
      >
        <Grid container spacing={3}>
          {(draft.length > 0 || draftQuery.isLoading) && (
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
                isLoading={draftQuery.isLoading}
                isFetchingMore={draftQuery.isFetchingNextPage}
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
              isLoading={upcomingQuery.isLoading}
              isFetchingMore={upcomingQuery.isFetchingNextPage}
            />
          </Grid>
          {(past.length > 0 || pastQuery.isLoading) && (
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
                isLoading={pastQuery.isLoading}
                isFetchingMore={pastQuery.isFetchingNextPage}
              />
            </Grid>
          )}
        </Grid>
        <Box ref={loadMoreRef} sx={{ height: 1 }}>
          {isAnyFetchingNextPage ? (
            <Box sx={{ pt: 2 }}>
              <Button disabled variant="text" size="small">
                Loading more...
              </Button>
            </Box>
          ) : null}
        </Box>
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
