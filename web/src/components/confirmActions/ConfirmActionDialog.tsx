import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

type ConfirmActionDialogProps = {
  open: boolean;
  title: string;
  content: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
  zIndex?: number;
};

export default function ConfirmActionDialog({
  open,
  title,
  content,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onClose,
  zIndex = 1600,
}: ConfirmActionDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      sx={{ zIndex }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {typeof content === "string" ? (
            <Typography variant="body2">{content}</Typography>
          ) : (
            <>{content}</>
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{cancelText}</Button>
        <Button onClick={onConfirm} variant="contained" color="primary">
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
