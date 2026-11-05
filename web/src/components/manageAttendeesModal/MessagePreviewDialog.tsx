import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { MessagePreviewResponse } from "./useMessagePreview";

type MessagePreviewDialogProps = {
  open: boolean;
  onClose: () => void;
  labels: string[];
  preview?: MessagePreviewResponse;
  loading: boolean;
  error?: string;
};

export function MessagePreviewDialog({
  open,
  onClose,
  labels,
  preview,
  loading,
  error,
}: MessagePreviewDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      fullScreen={fullScreen}
    >
      <DialogTitle>Message preview</DialogTitle>
      <DialogContent dividers>
        {loading && <Typography>Rendering preview...</Typography>}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && preview && (
          <Stack spacing={3}>
            {preview.previews.map((item, index) => (
              <Box key={index}>
                <Divider sx={{ mb: 1 }}>{labels[index]}</Divider>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "76px minmax(0, 1fr)",
                    columnGap: 0.5,
                    mb: 1,
                    overflowWrap: "anywhere",
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    From:
                  </Typography>
                  <Typography variant="body2">{item.from}</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    To:
                  </Typography>
                  <Typography variant="body2">{item.to}</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    Subject:
                  </Typography>
                  <Typography variant="body2">{item.subject}</Typography>
                </Box>
                <Box
                  component="iframe"
                  title={`Email preview ${index + 1}`}
                  srcDoc={item.html}
                  sandbox=""
                  sx={{
                    width: "100%",
                    height: { xs: "65vh", sm: 560 },
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                    bgcolor: "background.paper",
                  }}
                />
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
