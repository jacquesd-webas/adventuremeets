import {
  Typography,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button
} from "@mui/material";
import { useFetchMeets } from "../hooks/useFetchMeets";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PlaceIcon from "@mui/icons-material/Place";
import { Heading } from "../components/Heading";
import { useState } from "react";
import { CreateMeetModal } from "../components/createMeetModal/CreateMeetModal";
import { useNavigate } from "react-router-dom";
import { MeetStatus } from "../components/MeetStatus";
import { ManageAttendeesModal } from "../components/manageAttendeesModal";
import { ReportsModal } from "../components/reportsModal";
import { MeetActionsMenu } from "../components/MeetActionsMenu";

function PlanPage() {
  const [showModal, setShowModal] = useState(false);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [selectedMeetId, setSelectedMeetId] = useState<string | null>(null);
  const { data: meets, isLoading, refetch } = useFetchMeets({ view: "plan", page: 1, limit: 50 });
  const navigate = useNavigate();
  const handleRowAction = (meet: any) => {
    const statusId = meet?.status_id;
    setSelectedMeetId(meet.id);
    if (statusId === 1 || statusId === 6) {
      setShowModal(true);
      return;
    }
    if (statusId === 2 || statusId === 3) {
      setShowAttendeesModal(true);
      return;
    }
    if (statusId === 4 || statusId === 5) {
      setShowReportsModal(true);
      return;
    }
  };

  return (
    <Stack spacing={2}>
      <Heading
        title="Plan"
        subtitle="Manage draft, published, and postponed meets."
        actionComponent={
          <Button
            variant="outlined"
            onClick={() => {
              setSelectedMeetId(null);
              setShowModal(true);
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
                  onClick={() => handleRowAction(meet)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>
                    <Typography fontWeight={600}>{meet.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AccessTimeIcon fontSize="small" color="disabled" />
                      {((meet as any).start_time || (meet as any).start) ? (
                        <Typography variant="body2">
                          {new Date((meet as any).start_time || (meet as any).start).toLocaleString()}
                        </Typography>
                      ) : null}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PlaceIcon fontSize="small" color="disabled" />
                      <Typography variant="body2">{(meet as any).location}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <MeetStatus statusId={(meet as any).status_id} fallbackLabel={(meet as any).status || "Scheduled"} />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <MeetActionsMenu
                        meetId={meet.id}
                        statusId={(meet as any).status_id}
                        onEdit={() => {
                          setSelectedMeetId(meet.id);
                          setShowModal(true);
                        }}
                        onPreview={() => navigate(`/meets/${(meet as any).share_code || meet.id}`)}
                        onAttendees={() => {
                          setSelectedMeetId(meet.id);
                          setShowAttendeesModal(true);
                        }}
                        onReports={() => {
                          setSelectedMeetId(meet.id);
                          setShowReportsModal(true);
                        }}
                        onCheckin={() => {
                          navigate(`/meet/${meet.id}/checkin`);
                        }}
                        onOpen={() => {}}
                        onPostpone={() => {}}
                        onDelete={() => {}}
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
      <CreateMeetModal
        open={showModal}
        meetId={selectedMeetId}
        onClose={() => {
          setShowModal(false);
          setSelectedMeetId(null);
        }}
        onCreated={() => refetch()}
      />
      <ManageAttendeesModal
        open={showAttendeesModal}
        meetId={selectedMeetId}
        onClose={() => {
          setShowAttendeesModal(false);
          setSelectedMeetId(null);
        }}
      />
      <ReportsModal
        open={showReportsModal}
        meetId={selectedMeetId}
        onClose={() => {
          setShowReportsModal(false);
          setSelectedMeetId(null);
        }}
      />
    </Stack>
  );
}

export default PlanPage;
