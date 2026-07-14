import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  AttendeeUploadConflict,
  AttendeeUploadConflictAction,
} from "./AttendeeUploadButton";

type AttendeeUploadConflictsDialogProps = {
  open: boolean;
  conflicts: AttendeeUploadConflict[];
  actions: AttendeeUploadConflictAction[];
  isSubmitting?: boolean;
  onActionChange: (
    index: number,
    action: AttendeeUploadConflictAction,
  ) => void;
  onConfirm: () => void;
  onClose: () => void;
};

export function AttendeeUploadConflictsDialog({
  open,
  conflicts,
  actions,
  isSubmitting = false,
  onActionChange,
  onConfirm,
  onClose,
}: AttendeeUploadConflictsDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const content = (
    <>
      <DialogTitle>Conflicting attendee rows</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            These rows were not imported because the email already exists on this
            meet with a different name.
          </Typography>
          {conflicts.map((conflict, index) => (
            <Stack
              key={`${conflict.rowNumber ?? index}-${conflict.email}-${conflict.uploadedName}`}
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "flex-start" }}
              justifyContent="space-between"
            >
              <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="subtitle2">
                  {conflict.rowNumber
                    ? `Row ${conflict.rowNumber}`
                    : "Uploaded row"}
                </Typography>
                <Typography variant="body2">Email: {conflict.email}</Typography>
                <Typography variant="body2">
                  Imported name: {conflict.uploadedName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Existing name
                  {conflict.conflictingNames.length === 1 ? "" : "s"}:{" "}
                  {conflict.conflictingNames.join(", ")}
                </Typography>
              </Stack>
              <FormControl
                size="small"
                sx={{ width: { xs: "100%", sm: 220 }, flexShrink: 0 }}
              >
                <InputLabel id={`upload-conflict-action-${index}`}>
                  Action
                </InputLabel>
                <Select
                  labelId={`upload-conflict-action-${index}`}
                  label="Action"
                  value={actions[index] ?? "ignore"}
                  onChange={(event) =>
                    onActionChange(
                      index,
                      event.target.value as AttendeeUploadConflictAction,
                    )
                  }
                >
                  <MenuItem value="ignore">Ignore</MenuItem>
                  <MenuItem value="replace">Replace</MenuItem>
                  <MenuItem value="add_as_minor">Add as minor</MenuItem>
                </Select>
              </FormControl>
              {index < conflicts.length - 1 ? <Divider sx={{ pt: 1.5 }} /> : null}
            </Stack>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Ignore
        </Button>
        <Button onClick={onConfirm} variant="contained" disabled={isSubmitting}>
          Apply actions
        </Button>
      </DialogActions>
    </>
  );

  return fullScreen ? (
    <Drawer anchor="bottom" open={open} onClose={onClose}>
      {content}
    </Drawer>
  ) : (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      {content}
    </Dialog>
  );
}
