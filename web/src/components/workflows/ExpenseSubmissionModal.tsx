import {
  Box,
  Button,
  CircularProgress,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Modal,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useRef, useState } from "react";
import { useApi } from "../../hooks/useApi";

type WorkflowTask = {
  id: string;
  meetId: string;
  workflowType: string;
  payload: {
    meetName?: string;
    meetLocation?: string;
    meetLocationLat?: number;
    meetLocationLng?: number;
  };
};

type ExpenseSubmissionModalProps = {
  open: boolean;
  task: WorkflowTask;
  onClose: () => void;
  onSubmitted: () => void;
};

export function ExpenseSubmissionModal({
  open,
  task,
  onClose,
  onSubmitted,
}: ExpenseSubmissionModalProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const api = useApi();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setAttachments((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("workflowTaskId", task.id);
      if (notes.trim()) formData.append("notes", notes.trim());
      attachments.forEach((file) => formData.append("attachments", file));

      const token =
        typeof window !== "undefined"
          ? window.localStorage.getItem("accessToken")
          : null;

      const res = await fetch(
        `${api.baseUrl}/meets/${task.meetId}/expense-submissions`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        },
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Submission failed");
      }

      onSubmitted();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalStyles = {
    position: "absolute" as const,
    top: fullScreen ? 0 : "50%",
    left: fullScreen ? 0 : "50%",
    transform: fullScreen ? "none" : "translate(-50%, -50%)",
    width: fullScreen ? "100%" : 560,
    height: fullScreen ? "100%" : "auto",
    maxHeight: fullScreen ? "100%" : "85vh",
    p: fullScreen ? 2 : 3,
    outline: "none",
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyles}>
        <Paper
          elevation={3}
          sx={{
            height: "100%",
            maxHeight: "inherit",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}
          >
            <Typography variant="h6">Submit expenses</Typography>
          </Stack>

          <Box sx={{ p: 2, overflow: "auto", flex: 1 }}>
            <Stack spacing={2}>
              {task.payload.meetLocation && (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: theme.palette.action.hover,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Meet location
                  </Typography>
                  <Typography variant="body2">
                    {task.payload.meetLocation}
                  </Typography>
                </Box>
              )}

              <TextField
                label="Notes"
                multiline
                minRows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe expenses, mileage details, etc."
                fullWidth
              />

              <Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={1}
                >
                  <Typography variant="body2" fontWeight={500}>
                    Attachments
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AttachFileIcon />}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Add files
                  </Button>
                </Stack>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  hidden
                  onChange={handleAddFiles}
                />
                {attachments.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No attachments added.
                  </Typography>
                ) : (
                  <List dense disablePadding>
                    {attachments.map((file, index) => (
                      <ListItem
                        key={index}
                        disablePadding
                        secondaryAction={
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleRemoveFile(index)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        }
                      >
                        <ListItemText
                          primary={file.name}
                          secondary={`${(file.size / 1024).toFixed(1)} KB`}
                          primaryTypographyProps={{ variant: "body2" }}
                          secondaryTypographyProps={{ variant: "caption" }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>

              {error && (
                <Typography variant="body2" color="error">
                  {error}
                </Typography>
              )}
            </Stack>
          </Box>

          <DialogActions
            sx={{
              px: 2,
              py: 1.5,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Button onClick={onClose} disabled={isSubmitting}>
              Skip
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isSubmitting}
              startIcon={
                isSubmitting ? <CircularProgress size={16} /> : undefined
              }
            >
              Submit expenses
            </Button>
          </DialogActions>
        </Paper>
      </Box>
    </Modal>
  );
}
