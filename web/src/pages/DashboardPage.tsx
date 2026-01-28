import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  Grid,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Heading } from "../components/Heading";
import { useFetchMeets } from "../hooks/useFetchMeets";
import { useMeetStatusLookup } from "../hooks/useFetchMeetStatuses";
import Meet from "../types/MeetModel";
import MeetStatusEnum from "../types/MeetStatusEnum";
import {
  MeetActionsDialogs,
  PendingAction,
} from "../components/MeetActionsDialogs";
import { MeetColumn } from "../components/dashboard/MeetColumn";
import { MobileDashboardTitle } from "../components/dashboard/MobileDashboardTitle";
import { useCurrentOrganization } from "../context/OrganizationContext";
import { CreatePrivateOrganizationDialog } from "../components/CreatePrivateOrganizationDialog";

function DashboardPage() {
  const [selectedMeetId, setSelectedMeetId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null
  );
  const [showCreateOrgDialog, setShowCreateOrgDialog] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { currentOrganizationId, currentOrganizationRole } =
    useCurrentOrganization();
  const { data: meets, isLoading } = useFetchMeets({
    view: currentOrganizationRole === "member" ? "my" : "all",
    page: 1,
    limit: 50,
    organizationId: currentOrganizationId || undefined,
  });
  const { getName: getStatusName } = useMeetStatusLookup();

  const isOrganizer =
    currentOrganizationRole === "organizer" ||
    currentOrganizationRole === "admin";

  const handleNewMeet = () => {
    if (!isOrganizer) {
      setShowCreateOrgDialog(true);
      return;
    }
    setPendingAction("create");
  };

  const { upcoming, past, draft, columns } = useMemo(() => {
    const now = new Date();
    const draftMeets: Meet[] = meets.filter(
      (m: Meet) => m.statusId === MeetStatusEnum.Draft
    );
    const upcomingMeets: Meet[] = meets.filter(
      (m: Meet) =>
        m.statusId !== MeetStatusEnum.Draft && new Date(m.endTime) >= now
    );
    const pastMeets: Meet[] = meets.filter(
      (m: Meet) =>
        m.statusId !== MeetStatusEnum.Draft && new Date(m.endTime) < now
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

  return (
    <Container
      maxWidth="lg"
      sx={{
        pt: 1,
        pb: 4,
        height: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {isMobile ? (
        <MobileDashboardTitle onNewMeet={handleNewMeet} />
      ) : (
        <Heading
          title="Dashboard"
          subtitle="View upcoming and past meets that you are organising or attending."
          actionComponent={
            <Button variant="contained" onClick={handleNewMeet}>
              New Meet
            </Button>
          }
        />
      )}

      <Box sx={{ flex: 1, overflowY: "auto", pr: 1 }}>
        <Grid container spacing={3}>
          {draft && draft.length > 0 && (
            <Grid item xs={12} md={12 / columns}>
              <MeetColumn
                title="Draft Meets"
                meets={draft}
                statusFallback="Draft"
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
                getStatusLabel={getStatusName}
                setSelectedMeetId={setSelectedMeetId}
                setPendingAction={setPendingAction}
                isLoading={isLoading}
              />
            </Grid>
          )}
        </Grid>
      </Box>
      {isOrganizer ? (
        <MeetActionsDialogs
          meetId={selectedMeetId || null}
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
