import {
  Typography,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PlaceIcon from "@mui/icons-material/Place";
import { useState } from "react";
import { Heading } from "../components/Heading";
import { MeetStatus } from "../components/MeetStatus";
import { MeetActionsMenu } from "../components/MeetActionsMenu";
import { MeetActionsDialogs } from "../components/MeetActionsDialogs";
import { useFetchMeets } from "../hooks/useFetchMeets";
import { defaultPendingAction } from "../helpers/defaultPendingAction";
import { MeetActionsEnum } from "../types/MeetActionsEnum";
import { useCurrentOrganization } from "../context/organizationContext";
import { useAuth } from "../context/authContext";

function PlanPage() {
  const [selectedMeetId, setSelectedMeetId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<MeetActionsEnum | null>(
    null
  );
  const { currentOrganizationId } = useCurrentOrganization();
  const { user } = useAuth();
  const { data: meets, isLoading } = useFetchMeets({
    view: "all",
    page: 1,
    limit: 50,
    organizationId: currentOrganizationId,
  });

  return (
    <Stack spacing={2}>
      <Heading
        title="Meets List"
        subtitle="Manage all meets from one place."
        actionComponent={
          <Button
            variant="outlined"
            onClick={() => {
              setPendingAction(MeetActionsEnum.Create);
            }}
          >
            New meet
          </Button>
        }
      />
      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>When</TableCell>
              <TableCell>Where</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2" color="text.secondary">
                    Loading meets...
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              meets.map((meet) => (
                <TableRow
                  key={meet.id}
                  hover
                  onClick={() =>
                    setPendingAction(defaultPendingAction(meet.statusId))
                  }
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>
                    <Typography fontWeight={600}>{meet.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AccessTimeIcon fontSize="small" color="disabled" />
                      {(meet as any).start_time || (meet as any).start ? (
                        <Typography variant="body2">
                          {new Date(
                            (meet as any).start_time || (meet as any).start
                          ).toLocaleString()}
                        </Typography>
                      ) : null}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PlaceIcon fontSize="small" color="disabled" />
                      <Typography variant="body2">
                        {(meet as any).location}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <MeetStatus
                      statusId={meet.statusId}
                      fallbackLabel={meet.status || "Unknown"}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                    >
                      <MeetActionsMenu
                        meetId={meet.id}
                        statusId={meet.statusId}
                        isOrganizer={meet.organizerId === user?.id}
                        setSelectedMeetId={setSelectedMeetId}
                        setPendingAction={setPendingAction}
                      />
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && !meets.length && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2" color="text.secondary">
                    No meets to plan.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
      <MeetActionsDialogs
        meetId={selectedMeetId}
        pendingAction={pendingAction || undefined}
        setPendingAction={setPendingAction}
        setSelectedMeetId={setSelectedMeetId}
      />
    </Stack>
  );
}

export default PlanPage;
