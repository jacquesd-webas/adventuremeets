import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useApi } from "../../hooks/useApi";
import { useUpdateMeetStatus } from "../../hooks/useUpdateMeetStatus";
import MeetStatusEnum from "../../types/MeetStatusEnum";
import { AttendeeUploadMappingDialog } from "../manageAttendeesModal/AttendeeUploadMappingDialog";
import { AttendeeUploadConflictsDialog } from "../manageAttendeesModal/AttendeeUploadConflictsDialog";
import type {
  AttendeeUploadConflict,
  AttendeeUploadConflictAction,
  AttendeeUploadResponse,
} from "../manageAttendeesModal/AttendeeUploadButton";
import {
  type AttendeeColumnAssignment,
  type AttendeeUploadPreview,
  guessAttendeeColumnAssignments,
  inspectAttendeeWorkbook,
  requiredAttendeeColumnRoles,
} from "../manageAttendeesModal/attendeeUploadWorkbook";
import {
  createMeetReportAttendeeWorkbook,
  listMeetReportAttendees,
  readMeetReportHeadings,
  readMeetReportRows,
} from "./uploadMeetWorkbook";

type Props = {
  open: boolean;
  organizationId: string;
  onClose: () => void;
};

export function UploadMeetDialog({ open, organizationId, onClose }: Props) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { updateStatusAsync, isLoading: isCompleting } = useUpdateMeetStatus();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [reportOrganiser, setReportOrganiser] = useState("");
  const [organiserSelection, setOrganiserSelection] = useState<string | null>(
    null,
  );
  const [attendeeRows, setAttendeeRows] = useState<string[][]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<AttendeeUploadPreview | null>(null);
  const [assignments, setAssignments] = useState<AttendeeColumnAssignment[]>(
    [],
  );
  const [mappingOpen, setMappingOpen] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const [error, setError] = useState("");
  const [createdMeetId, setCreatedMeetId] = useState<string | null>(null);
  const [uploadedResult, setUploadedResult] =
    useState<AttendeeUploadResponse | null>(null);
  const [conflicts, setConflicts] = useState<AttendeeUploadConflict[]>([]);
  const [conflictActions, setConflictActions] = useState<
    AttendeeUploadConflictAction[]
  >([]);
  const attendees = listMeetReportAttendees(attendeeRows, assignments);
  const reportOrganiserMatch = attendees.find(
    (attendee) =>
      attendee.name.toLowerCase() === reportOrganiser.toLowerCase() ||
      attendee.email.toLowerCase() === reportOrganiser.toLowerCase(),
  );
  const organiserEmail =
    organiserSelection ?? reportOrganiserMatch?.email ?? "";
  const selectedOrganiserEmail = attendees.some(
    (attendee) => attendee.email === organiserEmail,
  )
    ? organiserEmail
    : "";

  const createMeet = useMutation({
    mutationFn: async () => {
      const start = new Date(`${date}T12:00:00`);
      if (Number.isNaN(start.getTime()))
        throw new Error("Enter a valid meet date.");
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      return api.post<{ id: string }>("/meets", {
        name: name.trim(),
        organizationId,
        reportOrganizerEmail: selectedOrganiserEmail,
        statusId: MeetStatusEnum.Draft,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        startTimeTbc: true,
        endTimeTbc: true,
      });
    },
    onSuccess: (meet) => {
      setCreatedMeetId(meet.id);
      queryClient.invalidateQueries({ queryKey: ["meets"] });
      queryClient.invalidateQueries({ queryKey: ["meet", meet.id] });
    },
  });

  const uploadAttendees = useMutation({
    mutationFn: async ({
      meetId,
      uploadFile,
    }: {
      meetId: string;
      uploadFile: File;
    }) => {
      const form = new FormData();
      form.append("file", uploadFile);
      return api.postForm<AttendeeUploadResponse>(
        `/meets/${meetId}/attendees/upload`,
        form,
      );
    },
    onSuccess: (_result, { meetId }) => {
      queryClient.invalidateQueries({ queryKey: ["meet-attendees", meetId] });
      queryClient.invalidateQueries({ queryKey: ["meet", meetId] });
      queryClient.invalidateQueries({ queryKey: ["meets"] });
    },
  });

  const resolveConflicts = useMutation({
    mutationFn: async () => {
      if (!createdMeetId)
        throw new Error("Meet is required for conflict resolution.");
      const resolutions = conflicts.flatMap((conflict, index) => {
        const action = conflictActions[index] ?? "ignore";
        return action === "ignore"
          ? []
          : [
              {
                action,
                existingAttendeeId: conflict.existingAttendeeId,
                attendee: conflict.attendee,
              },
            ];
      });
      if (!resolutions.length) return;
      await api.post(
        `/meets/${createdMeetId}/attendees/upload-conflicts/resolve`,
        { resolutions },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["meet-attendees", createdMeetId],
      });
      queryClient.invalidateQueries({ queryKey: ["meet", createdMeetId] });
      setConflicts([]);
      setConflictActions([]);
      closeAndReset(true);
    },
    onError: (cause) => setError(cause.message),
  });

  const busy =
    inspecting ||
    createMeet.isPending ||
    uploadAttendees.isPending ||
    isCompleting;

  function closeAndReset(force = false) {
    if (busy && !force) return;
    setName("");
    setDate("");
    setReportOrganiser("");
    setOrganiserSelection(null);
    setAttendeeRows([]);
    setFile(null);
    setPreview(null);
    setAssignments([]);
    setMappingOpen(false);
    setError("");
    setCreatedMeetId(null);
    setUploadedResult(null);
    setConflicts([]);
    setConflictActions([]);
    onClose();
  }

  async function selectFile(nextFile?: File) {
    if (!nextFile) return;
    setInspecting(true);
    setError("");
    try {
      const nextPreview = await inspectAttendeeWorkbook(nextFile);
      const nextAssignments = guessAttendeeColumnAssignments(
        nextPreview.columns,
      );
      const headings = readMeetReportHeadings(nextPreview);
      const rows = await readMeetReportRows(nextPreview);
      setName((current) => current || headings.name || "");
      setDate((current) => current || headings.date || "");
      setReportOrganiser(headings.organiser || "");
      setOrganiserSelection(null);
      setAttendeeRows(rows);
      setFile(nextFile);
      setPreview(nextPreview);
      setAssignments(nextAssignments);
      setMappingOpen(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not read the spreadsheet.",
      );
    } finally {
      setInspecting(false);
    }
  }

  function changeAssignment(
    index: number,
    assignment: AttendeeColumnAssignment,
  ) {
    setAssignments((current) =>
      current.map((value, offset) => {
        if (offset === index) return assignment;
        if (
          assignment !== "other" &&
          assignment !== "ignore" &&
          value === assignment
        )
          return "other";
        return value;
      }),
    );
  }

  async function submit() {
    if (!file || !preview || !name.trim() || !date) return;
    setError("");
    let result = uploadedResult;
    let meetId = createdMeetId;
    try {
      if (!result) {
        // Mapping rewrites worksheet cells, so use a fresh workbook on retries.
        const freshPreview = await inspectAttendeeWorkbook(file);
        const mapped = await createMeetReportAttendeeWorkbook(
          freshPreview,
          assignments,
          file.name,
        );
        meetId = meetId || (await createMeet.mutateAsync()).id;
        result = await uploadAttendees.mutateAsync({
          meetId,
          uploadFile: mapped,
        });
        setUploadedResult(result);
      }
      if (!meetId) throw new Error("The created meet could not be found.");
      await updateStatusAsync({ meetId, statusId: MeetStatusEnum.Completed });
      enqueueSnackbar(
        `Completed meet and imported ${result.created} attendee(s).${result.skipped ? ` Skipped ${result.skipped} row(s).` : ""}`,
        {
          variant: result.conflicts?.length ? "warning" : "success",
        },
      );
      setConflicts(result.conflicts ?? []);
      setConflictActions((result.conflicts ?? []).map(() => "ignore"));
      if (!result.conflicts?.length) closeAndReset(true);
    } catch (cause) {
      setError(
        `${cause instanceof Error ? cause.message : "Upload failed."} ${result ? "Attendees were imported; retry to complete the meet." : "If the draft meet was created, retrying will use the same meet."}`,
      );
    }
  }

  const hasRequiredColumns = requiredAttendeeColumnRoles.every((role) =>
    assignments.includes(role),
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={() => closeAndReset()}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Upload meet report</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Create a completed meet and import its attendees from an Excel
              sheet. Meet and Date are read from a report when available.
            </Typography>
            <TextField
              label="Meet name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              fullWidth
              disabled={Boolean(createdMeetId)}
            />
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              fullWidth
              disabled={Boolean(createdMeetId)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              label="Organiser"
              value={selectedOrganiserEmail}
              onChange={(event) => setOrganiserSelection(event.target.value)}
              fullWidth
              disabled={Boolean(createdMeetId) || !attendees.length}
              helperText='If the selected attendee has no active organisation account, an anonymous account "nobody" will be used.'
            >
              <MenuItem value="">Nobody</MenuItem>
              {attendees.map((attendee) => (
                <MenuItem
                  key={attendee.email.toLowerCase()}
                  value={attendee.email}
                >
                  {attendee.name} ({attendee.email})
                </MenuItem>
              ))}
            </TextField>
            <Box
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (!busy && !uploadedResult)
                  void selectFile(event.dataTransfer.files[0]);
              }}
              sx={{
                border: "2px dashed",
                borderColor: "divider",
                borderRadius: 1,
                p: 3,
                textAlign: "center",
              }}
            >
              <UploadFileIcon color="action" />
              <Typography variant="body2" sx={{ mb: 1 }}>
                {file?.name || "Drop an Excel file here"}
              </Typography>
              <Button
                component="label"
                variant="outlined"
                disabled={busy || Boolean(uploadedResult)}
              >
                Choose file
                <input
                  hidden
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(event) => {
                    void selectFile(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </Button>
            </Box>
            {file && (
              <Button onClick={() => setMappingOpen(true)} disabled={busy}>
                Review columns
              </Button>
            )}
            {!hasRequiredColumns && file && (
              <Alert severity="warning">
                Map the Name and Email columns before uploading.
              </Alert>
            )}
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => closeAndReset()} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void submit()}
            disabled={
              busy || !name.trim() || !date || !file || !hasRequiredColumns
            }
          >
            {busy ? "Uploading…" : "Create and import"}
          </Button>
        </DialogActions>
      </Dialog>
      <AttendeeUploadMappingDialog
        open={mappingOpen}
        columns={preview?.columns ?? []}
        questions={[]}
        assignments={assignments}
        isSubmitting={busy}
        confirmLabel="Use columns"
        onAssignmentChange={changeAssignment}
        onConfirm={() => setMappingOpen(false)}
        onClose={() => setMappingOpen(false)}
      />
      <AttendeeUploadConflictsDialog
        open={conflicts.length > 0}
        conflicts={conflicts}
        actions={conflictActions}
        isSubmitting={resolveConflicts.isPending}
        onActionChange={(index, action) =>
          setConflictActions((current) =>
            current.map((value, offset) => (offset === index ? action : value)),
          )
        }
        onConfirm={() => resolveConflicts.mutate()}
        onClose={() => closeAndReset(true)}
      />
    </>
  );
}
