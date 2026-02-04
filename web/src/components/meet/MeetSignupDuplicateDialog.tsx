import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

type MeetSignupDuplicateDialogProps = {
  open: boolean;
  onClose: () => void;
  onRemove: () => void;
  onUpdate: () => void;
};

export function MeetSignupDuplicateDialog({
  open,
  onClose,
  onRemove: _onRemove,
  onUpdate: _onUpdate,
}: MeetSignupDuplicateDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen}>
      <DialogTitle>Already signed up</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">
          You have already signed up for this meet. If you wish to make changes
          to your application, please use the link e-mailed to you. Alternately,
          you may contact the organizer directly to update or remove your
          application.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
