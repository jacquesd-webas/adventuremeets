import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  Button,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { useState } from "react";
import { useApi } from "../../hooks/useApi";
import { useSnackbar } from "notistack";

type MessageModalProps = {
  open: boolean;
  onClose: () => void;
  meetId: string;
  attendeeIds?: string[];
  attendees?: { id: string; status?: string }[];
  defaultSubject?: string;
};

export function MessageModal({
  open,
  onClose,
  meetId,
  attendeeIds,
  attendees,
  defaultSubject = "",
}: MessageModalProps) {
  const api = useApi();
  const { enqueueSnackbar } = useSnackbar();
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeConfirmed, setIncludeConfirmed] = useState(true);
  const [includeWaitlisted, setIncludeWaitlisted] = useState(false);
  const [includeRejected, setIncludeRejected] = useState(false);

  const reset = () => {
    setSubject(defaultSubject);
    setBody("");
    setError(null);
    setIncludeConfirmed(true);
    setIncludeWaitlisted(false);
    setIncludeRejected(false);
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      setError("Subject and message are required");
      return;
    }
    const ids =
      attendeeIds && attendeeIds.length
        ? attendeeIds
        : (attendees || [])
            .filter((att) => {
              const status = (att.status || "").toLowerCase();
              if (includeConfirmed && ["confirmed", "checked-in", "attended"].includes(status)) return true;
              if (includeWaitlisted && status === "waitlisted") return true;
              if (includeRejected && status === "canceled") return true;
              return false;
            })
            .map((att) => att.id);
    if ((!attendeeIds || attendeeIds.length === 0) && ids.length === 0) {
      setError("Select at least one recipient group");
      return;
    }
    if ((!attendeeIds || attendeeIds.length === 0) && !includeConfirmed && !includeWaitlisted && !includeRejected) {
      setError("Select at least one recipient group");
      return;
    }
    setIsSending(true);
    setError(null);
    try {
      await api.post(`/meets/${meetId}/message`, {
        subject: subject.trim(),
        text: body,
        attendee_ids: ids.length ? ids : undefined,
      });
      enqueueSnackbar("Message sent", {
        variant: "success",
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
      });
      onClose();
      reset();
    } catch (err: any) {
      setError(err?.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Send message</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && (
            <span style={{ color: "#d32f2f", fontSize: 14, fontWeight: 600 }}>
              {error}
            </span>
          )}
          <TextField
            label="Subject"
            fullWidth
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <TextField
            label="Message"
            fullWidth
            multiline
            minRows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          {!attendeeIds && (
            <Stack direction="column" spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={includeConfirmed}
                    onChange={(e) => setIncludeConfirmed(e.target.checked)}
                  />
                }
                label="Send to confirmed attendees"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={includeWaitlisted}
                    onChange={(e) => setIncludeWaitlisted(e.target.checked)}
                  />
                }
                label="Send to waitlisted attendees"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={includeRejected}
                    onChange={(e) => setIncludeRejected(e.target.checked)}
                  />
                }
                label="Send to rejected attendees"
              />
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSend} disabled={isSending}>
          {isSending ? "Sending..." : "Send"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
