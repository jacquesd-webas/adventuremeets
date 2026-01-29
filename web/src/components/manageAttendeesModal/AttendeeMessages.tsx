import { Box, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import CallReceivedOutlinedIcon from "@mui/icons-material/CallReceivedOutlined";
import CallMadeOutlinedIcon from "@mui/icons-material/CallMadeOutlined";
import { useMemo } from "react";
import {
  AttendeeMessage,
  useFetchAttendeeMessages,
} from "../../hooks/useFetchAttendeeMessages";

type AttendeeMessagesProps = {
  meetId?: string | null;
  attendeeId?: string | null;
};

type ParsedMessage = AttendeeMessage & {
  subject: string;
  body: string;
  direction: "received" | "sent";
};

const parseMessageContent = (
  content?: string
): { subject: string; body: string } => {
  console.log({ content });
  if (!content) return { subject: "No subject", body: "" };
  const normalized = content.replace(/\r\n/g, "\n");
  const match = normalized.match(/^Subject:\s*(.+)$/m);
  const subject = match?.[1]?.trim() || "No subject";
  let body = normalized;
  const headerIndex = normalized.indexOf("\n\n");
  if (headerIndex !== -1) {
    body = normalized.slice(headerIndex + 2);
  } else if (match?.index != null) {
    body = normalized.slice(match.index + match[0].length).trimStart();
  }
  console.log({ subject, body });
  return { subject, body };
};

export function AttendeeMessages({
  meetId,
  attendeeId,
}: AttendeeMessagesProps) {
  const { data, isLoading, error } = useFetchAttendeeMessages(
    meetId,
    attendeeId
  );

  const messages = useMemo<ParsedMessage[]>(
    () =>
      data.map((message) => {
        const parsed = parseMessageContent(message.content);
        const isSent =
          meetId &&
          typeof message.from === "string" &&
          message.from.toLowerCase().includes(meetId.toLowerCase());
        return {
          ...message,
          subject: parsed.subject,
          body: parsed.body,
          direction: isSent ? "sent" : "received",
        };
      }),
    [data, attendeeId]
  );

  if (!attendeeId) {
    return (
      <Typography variant="body2" color="text.secondary">
        Select an attendee to view their messages.
      </Typography>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
        <CircularProgress size={22} />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography variant="body2" color="error">
        {error}
      </Typography>
    );
  }

  if (!messages.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No messages
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {messages.map((message) => (
        <Paper key={message.id} variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={1}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1} alignItems="center">
                {message.direction === "sent" ? (
                  <CallMadeOutlinedIcon
                    fontSize="small"
                    color="action"
                    aria-label="Sent"
                  />
                ) : (
                  <CallReceivedOutlinedIcon
                    fontSize="small"
                    color="action"
                    aria-label="Received"
                  />
                )}
                <Typography variant="subtitle2">{message.subject}</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {message.timestamp
                  ? new Date(message.timestamp).toLocaleString()
                  : "—"}
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ whiteSpace: "pre-line", mt: 1 }}>
              {message.body || "—"}
            </Typography>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
