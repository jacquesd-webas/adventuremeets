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
import { getMeetResponseWording } from "../../helpers/meetResponseWording";

type MeetSignupDuplicateDialogProps = {
  open: boolean;
  onClose: () => void;
  onRemove: () => void;
  onUpdate: () => void;
  isRsvpMode?: boolean;
};

export function MeetSignupDuplicateDialog({
  open,
  onClose,
  onRemove: _onRemove,
  onUpdate: _onUpdate,
  isRsvpMode = false,
}: MeetSignupDuplicateDialogProps) {
  const wording = getMeetResponseWording(isRsvpMode);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen}>
      <DialogTitle>{wording.duplicateTitle}</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">{wording.duplicateBody}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
