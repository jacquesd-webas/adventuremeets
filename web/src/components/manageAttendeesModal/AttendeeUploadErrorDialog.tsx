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
            The uploaded document does not have the required fields and could
            not be imported. The headings must be exact and can also contain
            the questions. Please download the existing list as a sample to see
            what headings should be.
          </Typography>
          <Alert severity="info">
            Note: Leaving the status column blank will default to "invited".
            Any invalid status is ignored and any change to existing status is
            also ignored.
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
