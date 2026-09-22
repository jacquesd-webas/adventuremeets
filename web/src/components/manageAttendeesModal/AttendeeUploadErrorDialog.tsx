import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

type AttendeeUploadErrorDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function AttendeeUploadErrorDialog({
  open,
  onClose,
}: AttendeeUploadErrorDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const content = (
    <>
      <DialogTitle>Upload attendees</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2">
            The uploaded document could not be imported. Use a valid .xlsx or
            .xls workbook and ensure each attendee row contains a name and email
            address.
          </Typography>
          <Alert severity="info">
            Unfamiliar column headings can be matched to Name, Email, and Phone
            before the file is uploaded.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          OK
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
