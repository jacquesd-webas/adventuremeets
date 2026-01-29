import {
  Button,
  Box,
  Chip,
  CircularProgress,
  DialogActions,
  Modal,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import { useState, useMemo } from "react";
import { useApi } from "../../hooks/useApi";
import { useFetchMeetAttendees } from "../../hooks/useFetchMeetAttendees";
import { useFetchMeet } from "../../hooks/useFetchMeet";
import MeetStatusEnum from "../../types/MeetStatusEnum";

type ReportsModalProps = {
  open: boolean;
  onClose: () => void;
  meetId?: string | null;
};

export function ReportsModal({ open, onClose, meetId }: ReportsModalProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const api = useApi();
  const [isGenerating, setIsGenerating] = useState(false);
  const { data: attendees, isLoading } = useFetchMeetAttendees(
    meetId,
    "accepted"
  );
  const { data: meet } = useFetchMeet(meetId, Boolean(open && meetId));

  const baseColumns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "status", label: "Status" },
  ] as const;

  const filteredAttendees = attendees.filter((attendee) =>
    ["checked-in", "attended", "confirmed"].includes(attendee.status)
  );

  const statusId = useMemo(() => {
    const statusVal =
      typeof meet?.statusId !== "undefined" ? meet.statusId : null;
    const statusNum =
      typeof statusVal === "number"
        ? statusVal
        : statusVal != null
        ? Number(statusVal)
        : null;
    return !Number.isNaN(statusNum || NaN) ? statusNum : null;
  }, [meet]);

  const showCompletionWarning =
    statusId !== null && statusId !== MeetStatusEnum.Completed;

  const handleGenerateReport = async () => {
    if (!meetId || isGenerating) return;
    setIsGenerating(true);
    try {
      await api.post(`/meets/${meetId}/report`);
      onClose();
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStatus = (status: string) => {
    if (status === "confirmed") {
      return <Chip label="No show" color="error" size="small" />;
    }
    if (status === "checked-in" || status === "attended") {
      return <Chip label="Attended" color="success" size="small" />;
    }
    return status;
  };

  const modalStyles = {
    position: "absolute" as const,
    top: fullScreen ? 0 : "50%",
    left: fullScreen ? 0 : "50%",
    transform: fullScreen ? "none" : "translate(-50%, -50%)",
    width: fullScreen ? "100%" : "90%",
    maxWidth: fullScreen ? "100%" : 1100,
    height: fullScreen ? "100%" : "auto",
    maxHeight: fullScreen ? "100%" : "85vh",
    p: fullScreen ? 2 : 3,
    outline: "none",
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyles}>
        <Paper
          elevation={3}
          sx={{
            height: "100%",
            maxHeight: "inherit",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}
          >
            <Typography variant="h6">Meet report</Typography>
          </Stack>
          <Box sx={{ p: 2, overflow: "auto" }}>
            {isLoading ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 200,
                }}
              >
                <CircularProgress size={32} />
              </Box>
            ) : filteredAttendees.length === 0 ? (
              <Typography color="text.secondary">
                No attendees to report yet.
              </Typography>
            ) : (
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {baseColumns.map((column) => (
                      <TableCell key={column.key}>{column.label}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAttendees.map((attendee) => (
                    <TableRow key={attendee.id}>
                      {baseColumns.map((column) => (
                        <TableCell key={column.key}>
                          {column.key === "status"
                            ? renderStatus(attendee.status)
                            : (attendee as any)[column.key] ?? ""}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
          <DialogActions
            sx={{
              px: 2,
              py: 1.5,
              borderTop: `1px solid ${theme.palette.divider}`,
              justifyContent: "space-between",
            }}
          >
            {showCompletionWarning ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <WarningAmberOutlinedIcon
                  fontSize="small"
                  color="warning"
                />
                <Typography variant="body2" color="text.secondary">
                  Generating a report will set this meet to completed.
                </Typography>
              </Stack>
            ) : (
              <span />
            )}
            <Stack direction="row" spacing={1}>
              <Button onClick={onClose}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleGenerateReport}
                disabled={!meetId || isGenerating}
              >
                Generate report
              </Button>
            </Stack>
          </DialogActions>
        </Paper>
      </Box>
    </Modal>
  );
}
