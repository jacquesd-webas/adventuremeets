import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  Button,
  Box,
  Typography,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useSnackbar } from "notistack";
import { useNotifyAttendee } from "../../hooks/useNotifyAttendee";
import { useDefaultMessage } from "../../hooks/useDefaultMessage";
import Meet from "../../types/MeetModel";
import AttendeeStatusEnum from "../../types/AttendeeStatusEnum";
import { useQueryClient } from "@tanstack/react-query";

type MessageModalProps = {
  open: boolean;
  onClose: () => void;
  meet?: Meet | null;
  attendeeIds?: string[];
  attendees?: { id: string; status?: string }[];
  defaultSubject?: string;
};

export function MessageModal({
  open,
  onClose,
  meet,
  attendeeIds,
  attendees,
  defaultSubject = "",
}: MessageModalProps) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { notifyAttendeeAsync, isLoading } = useNotifyAttendee();
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState("");
  const [autoResponse, setAutoResponse] = useState(false);
  const [manualSubject, setManualSubject] = useState(defaultSubject);
  const [manualBody, setManualBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [includeConfirmed, setIncludeConfirmed] = useState(true);
  const [includeWaitlisted, setIncludeWaitlisted] = useState(false);
  const [includeRejected, setIncludeRejected] = useState(false);

  const attendeeStatus =
    attendeeIds && attendeeIds.length === 1
      ? (attendees?.find((att) => att.id === attendeeIds[0])
          ?.status as AttendeeStatusEnum)
      : undefined;
  const defaultMessageOptions = useMemo(
    () => ({
      meetName: meet?.name,
      confirmMessage: meet?.confirmMessage,
      waitlistMessage: meet?.waitlistMessage,
      rejectMessage: meet?.rejectMessage,
    }),
    [
      meet?.name,
      meet?.confirmMessage,
      meet?.waitlistMessage,
      meet?.rejectMessage,
    ]
  );
  const singleAttendeeDefault = useDefaultMessage(
    attendeeStatus,
    defaultMessageOptions
  );
  const confirmedDefault = useDefaultMessage(
    AttendeeStatusEnum.Confirmed,
    defaultMessageOptions
  );
  const waitlistedDefault = useDefaultMessage(
    AttendeeStatusEnum.Waitlisted,
    defaultMessageOptions
  );
  const rejectedDefault = useDefaultMessage(
    AttendeeStatusEnum.Rejected,
    defaultMessageOptions
  );
  const { subject: defaultAutoSubject, content: defaultAutoContent } =
    useMemo(() => {
      if (attendeeIds && attendeeIds.length === 1) {
        return singleAttendeeDefault;
      }

      const selectedDefaults = [];
      if (includeConfirmed)
        selectedDefaults.push({ label: "Confirmed", ...confirmedDefault });
      if (includeWaitlisted)
        selectedDefaults.push({ label: "Waitlisted", ...waitlistedDefault });
      if (includeRejected)
        selectedDefaults.push({ label: "Rejected", ...rejectedDefault });

      if (selectedDefaults.length === 1) {
        return {
          subject: selectedDefaults[0].subject,
          content: selectedDefaults[0].content,
        };
      }

      if (selectedDefaults.length > 1) {
        return {
          subject: "Meet attendance update",
          content: selectedDefaults
            .map((item) => `${item.label} attendees:\n${item.content}`)
            .join("\n\n"),
        };
      }

      return { subject: "", content: "" };
    }, [
      attendeeIds,
      includeConfirmed,
      includeRejected,
      includeWaitlisted,
      singleAttendeeDefault,
      confirmedDefault,
      waitlistedDefault,
      rejectedDefault,
    ]);

  useEffect(() => {
    if (autoResponse) {
      setSubject(defaultAutoSubject);
      setBody(defaultAutoContent);
    }
  }, [autoResponse, defaultAutoSubject, defaultAutoContent]);

  const reset = () => {
    setSubject(defaultSubject);
    setBody("");
    setAutoResponse(false);
    setManualSubject(defaultSubject);
    setManualBody("");
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
              const status = att.status as AttendeeStatusEnum;
              if (
                includeConfirmed &&
                [
                  AttendeeStatusEnum.Confirmed,
                  AttendeeStatusEnum.CheckedIn,
                  AttendeeStatusEnum.Attended,
                ].includes(status)
              )
                return true;
              if (includeWaitlisted && status === AttendeeStatusEnum.Waitlisted)
                return true;
              if (
                includeRejected &&
                (status === AttendeeStatusEnum.Rejected ||
                  status === AttendeeStatusEnum.Cancelled)
              )
                return true;
              return false;
            })
            .map((att) => att.id);
    if ((!attendeeIds || attendeeIds.length === 0) && ids.length === 0) {
      setError("Select at least one recipient group");
      return;
    }
    if (
      (!attendeeIds || attendeeIds.length === 0) &&
      !includeConfirmed &&
      !includeWaitlisted &&
      !includeRejected
    ) {
      setError("Select at least one recipient group");
      return;
    }
    setError(null);
    try {
      await notifyAttendeeAsync({
        meetId: meet.id,
        subject: subject.trim(),
        text: body,
        attendeeIds: ids.length ? ids : undefined,
      });
      await Promise.all(
        ids.map((attendeeId) =>
          queryClient.invalidateQueries({
            queryKey: ["attendee-messages", meet.id, attendeeId],
          })
        )
      );
      enqueueSnackbar("Message sent", {
        variant: "success",
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
      });
      onClose();
      reset();
    } catch (err: any) {
      setError(err?.message || "Failed to send message");
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TextField
              label="Subject"
              fullWidth
              size="small"
              value={subject}
              onChange={(e) => {
                const value = e.target.value;
                setSubject(value);
                if (!autoResponse) {
                  setManualSubject(value);
                }
              }}
              disabled={autoResponse}
            />
            <FormControlLabel
              label={<Typography variant="body2">Auto</Typography>}
              control={
                <Switch
                  checked={autoResponse}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setAutoResponse(checked);
                    if (checked) {
                      setManualSubject(subject);
                      setManualBody(body);
                      setSubject(defaultAutoSubject);
                      setBody(defaultAutoContent);
                    } else {
                      setSubject(manualSubject);
                      setBody(manualBody);
                    }
                  }}
                />
              }
              sx={{ m: 0, whiteSpace: "nowrap" }}
            />
          </Box>
          <TextField
            label="Message"
            fullWidth
            multiline
            minRows={4}
            value={body}
            onChange={(e) => {
              const value = e.target.value;
              setBody(value);
              if (!autoResponse) {
                setManualBody(value);
              }
            }}
            disabled={autoResponse}
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
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={
            isLoading ||
            (!attendeeIds &&
              !includeConfirmed &&
              !includeWaitlisted &&
              !includeRejected)
          }
        >
          {isLoading ? "Sending..." : "Send"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
