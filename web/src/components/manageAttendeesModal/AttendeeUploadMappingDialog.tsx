import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  AttendeeColumnAssignment,
  AttendeeUploadColumn,
  AttendeeUploadQuestion,
  appendToAttendeeName,
  attendeeColumnRoles,
  attendeeColumnLabels,
  requiredAttendeeColumnRoles,
} from "./attendeeUploadWorkbook";

type AttendeeUploadMappingDialogProps = {
  open: boolean;
  columns: AttendeeUploadColumn[];
  questions: AttendeeUploadQuestion[];
  assignments: AttendeeColumnAssignment[];
  isSubmitting?: boolean;
  confirmLabel?: string;
  onAssignmentChange: (
    columnIndex: number,
    assignment: AttendeeColumnAssignment,
  ) => void;
  onConfirm: () => void;
  onClose: () => void;
};

export function AttendeeUploadMappingDialog({
  open,
  columns,
  questions,
  assignments,
  isSubmitting = false,
  confirmLabel = "Import attendees",
  onAssignmentChange,
  onConfirm,
  onClose,
}: AttendeeUploadMappingDialogProps) {
  const missingRoles = requiredAttendeeColumnRoles.filter(
    (role) => !assignments.includes(role),
  );
  const previewRowCount = Math.max(
    0,
    ...columns.map((column) => column.previewValues.length),
  );
  const nameColumnIndex = assignments.indexOf("name");
  const surnameColumn = columns[assignments.indexOf("append_to_name")];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Match attendee columns</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Match the spreadsheet columns to the required attendee fields. We
            have preselected any headings we recognize.
          </Typography>
          {missingRoles.length ? (
            <Alert severity="warning">
              Select{" "}
              {missingRoles
                .map((role) => attendeeColumnLabels[role])
                .join(", ")}
              .
            </Alert>
          ) : null}
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {columns.map((column, index) => {
                    const label = column.header || `Column ${index + 1}`;
                    return (
                      <TableCell
                        key={column.columnIndex}
                        sx={{ minWidth: 180, verticalAlign: "top" }}
                      >
                        <Stack spacing={1}>
                          <Typography variant="caption" color="text.secondary">
                            {label}
                          </Typography>
                          <FormControl fullWidth size="small">
                            <InputLabel id={`attendee-column-${index}`}>
                              Use as
                            </InputLabel>
                            <Select
                              labelId={`attendee-column-${index}`}
                              label="Use as"
                              value={assignments[index] ?? "other"}
                              inputProps={{ "aria-label": `Use ${label} as` }}
                              onChange={(event) =>
                                onAssignmentChange(
                                  index,
                                  event.target
                                    .value as AttendeeColumnAssignment,
                                )
                              }
                            >
                              <MenuItem value="other">
                                Keep original heading
                              </MenuItem>
                              <MenuItem value="ignore">Ignore column</MenuItem>
                              {attendeeColumnRoles.map((role) => (
                                <MenuItem key={role} value={role}>
                                  {attendeeColumnLabels[role]}
                                </MenuItem>
                              ))}
                              <MenuItem value="append_to_name">
                                Append to Name
                              </MenuItem>
                              {questions.map((question, questionIndex) => (
                                <MenuItem
                                  key={question.id}
                                  value={`question:${questionIndex + 1}`}
                                >
                                  {question.label ||
                                    `Question ${questionIndex + 1}`}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Stack>
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from({ length: previewRowCount }, (_, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {columns.map((column, columnIndex) => (
                      <TableCell
                        key={column.columnIndex}
                        sx={
                          assignments[columnIndex] === "ignore"
                            ? { color: "text.disabled" }
                            : undefined
                        }
                      >
                        {(columnIndex === nameColumnIndex && surnameColumn
                          ? appendToAttendeeName(
                              column.previewValues[rowIndex] || "",
                              surnameColumn.previewValues[rowIndex] || "",
                            )
                          : column.previewValues[rowIndex]) || "—"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={isSubmitting || missingRoles.length > 0}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
