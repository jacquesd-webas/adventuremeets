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
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip
} from "@mui/material";
import { useFetchMeets } from "../hooks/useFetchMeets";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PlaceIcon from "@mui/icons-material/Place";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Heading } from "../components/Heading";
import { useState } from "react";
import { CreateMeetModal } from "../components/createMeetModal/CreateMeetModal";
import { useNavigate } from "react-router-dom";
import { MeetStatus } from "../components/MeetStatus";

function PlanPage() {
  const [showPast, setShowPast] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedMeetId, setSelectedMeetId] = useState<string | null>(null);
  const { data: meets, isLoading, refetch } = useFetchMeets({ upcoming: !showPast, page: 1, limit: 50 });
  const navigate = useNavigate();

  return (
    <Stack spacing={2}>
      <Heading
        title="Plan"
        subtitle="Manage and review your upcoming meets."
        secondaryActionComponent={
          <FormControlLabel
            control={<Switch checked={showPast} onChange={(e) => setShowPast(e.target.checked)} />}
            label="Show past events"
          />
        }
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
                <TableRow key={meet.id}>
                  <TableCell>
                    <Typography fontWeight={600}>{meet.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AccessTimeIcon fontSize="small" color="disabled" />
                      <Typography variant="body2">
                        {new Date((meet as any).start_time || (meet as any).start).toLocaleString()}
                      </Typography>
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
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedMeetId(meet.id);
                            setShowModal(true);
                          }}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Preview">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/meets/${(meet as any).share_code || meet.id}`)}
                        >
                          <OpenInNewOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => {}}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && !meets.length && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2" color="text.secondary">
                    No upcoming meets.
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
    </Stack>
  );
}

export default PlanPage;
