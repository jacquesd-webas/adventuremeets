import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";

type ReportsModalProps = {
  open: boolean;
  onClose: () => void;
  meetId?: string | null;
};

export function ReportsModal({ open, onClose, meetId }: ReportsModalProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" fullScreen={fullScreen}>
      <DialogTitle>Meet reports</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" sx={{ mb: 1 }}>
          Reports are coming soon.
        </Typography>
        {meetId ? (
          <Typography variant="caption" color="text.secondary">
            Meet ID: {meetId}
          </Typography>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
