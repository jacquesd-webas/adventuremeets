import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";

type CreatePrivateOrganizationDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreate?: () => void;
};

export function CreatePrivateOrganizationDialog({
  open,
  onClose,
  onCreate,
}: CreatePrivateOrganizationDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create a private organisation</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            You need organiser access in the current organisation to create a
            meet. You can ask an admin to promote you, or create a private
            organisation to manage your own meets.
          </Typography>

          <Typography variant="body2" color="text.secondary">
            <i>This functionality is coming soon!</i>
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button disabled variant="contained" onClick={onCreate || onClose}>
          Create private organisation
        </Button>
      </DialogActions>
    </Dialog>
  );
}
