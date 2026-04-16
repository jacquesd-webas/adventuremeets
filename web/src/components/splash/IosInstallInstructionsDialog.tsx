import IosShareIcon from "@mui/icons-material/IosShare";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

type IosInstallInstructionsDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function IosInstallInstructionsDialog({
  open,
  onClose,
}: IosInstallInstructionsDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const content = (
    <>
      <DialogTitle>Install on iPhone</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          Safari on iPhone does not support a one-tap install prompt. Use these
          steps to add AdventureMeets to your home screen.
        </Typography>
        <Box
          sx={{
            mt: 2,
            display: "grid",
            gap: 1.5,
            color: "#334155",
          }}
        >
          <Typography variant="body2">
            1. Tap the <IosShareIcon sx={{ fontSize: 16, verticalAlign: "text-bottom", mx: 0.25 }} />{" "}
            Share button in Safari.
          </Typography>
          <Typography variant="body2">
            2. Scroll down and tap <strong>Add to Home Screen</strong>.
          </Typography>
          <Typography variant="body2">
            3. Tap <strong>Add</strong> in the top-right corner.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          Got it
        </Button>
      </DialogActions>
    </>
  );

  if (fullScreen) {
    return (
      <Drawer anchor="bottom" open={open} onClose={onClose}>
        {content}
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      {content}
    </Dialog>
  );
}
