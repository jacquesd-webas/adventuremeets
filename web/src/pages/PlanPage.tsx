import { Typography, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Chip, Button, FormControlLabel, Switch } from "@mui/material";
import { useFetchMeets } from "../hooks/useFetchMeets";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PlaceIcon from "@mui/icons-material/Place";
import { Heading } from "../components/Heading";
import { useState } from "react";
import { CreateMeetModal } from "../components/createMeetModal/CreateMeetModal";

function PlanPage() {
  const [showPast, setShowPast] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { data: meets, isLoading } = useFetchMeets({ upcoming: !showPast, page: 1, limit: 50 });

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
        actionComponent={<Button variant="outlined" onClick={() => setShowModal(true)}>New meet</Button>}
      />
      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>When</TableCell>
              <TableCell>Where</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4}>
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
                    <Chip size="small" label={(meet as any).status || "Scheduled"} color="primary" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && !meets.length && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography variant="body2" color="text.secondary">
                    No upcoming meets.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
      <CreateMeetModal open={showModal} onClose={() => setShowModal(false)} />
    </Stack>
  );
}

export default PlanPage;
