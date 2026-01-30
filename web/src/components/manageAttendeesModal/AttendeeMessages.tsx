import { Box, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import CallReceivedOutlinedIcon from "@mui/icons-material/CallReceivedOutlined";
import CallMadeOutlinedIcon from "@mui/icons-material/CallMadeOutlined";
import { useMemo, useState } from "react";
import {
  AttendeeMessage,
  useFetchAttendeeMessages,
} from "../../hooks/useFetchAttendeeMessages";
import { useMarkAttendeeMessageRead } from "../../hooks/useMarkAttendeeMessageRead";

type AttendeeMessagesProps = {
  meetId?: string | null;
  attendeeId?: string | null;
  attendeeEmail?: string | null;
};

type ParsedMessage = AttendeeMessage & {
  subject: string;
  body: string;
  direction: "received" | "sent";
};

const parseMessageContent = (
  content?: string
): { subject: string; body: string } => {
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
  return { subject, body };
};

export function AttendeeMessages({
  meetId,
  attendeeId,
  attendeeEmail,
}: AttendeeMessagesProps) {
  const { data, isLoading, error } = useFetchAttendeeMessages(
    meetId,
    attendeeId
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const { markRead } = useMarkAttendeeMessageRead();

  const messages = useMemo<ParsedMessage[]>(
    () =>
      data.map((message) => {
        const parsed = parseMessageContent(message.content);
        const isSent =
          attendeeEmail &&
          typeof message.to === "string" &&
          message.to.toLowerCase().includes(attendeeEmail.toLowerCase());
        return {
          ...message,
          subject: parsed.subject,
          body: parsed.body,
          direction: isSent ? "sent" : "received",
        };
      }),
    [data, attendeeEmail]
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
        <Paper
          key={message.id}
          variant="outlined"
          sx={{ p: 2, cursor: "pointer" }}
          onClick={() => {
            setExpandedIds((prev) => {
              const next = new Set(prev);
              if (next.has(message.id)) {
                next.delete(message.id);
              } else {
                next.add(message.id);
              }
              return next;
            });
            if (
              message.isRead === false &&
              meetId &&
              message.direction === "received"
            ) {
              markRead({ meetId, messageId: message.id, attendeeId });
            }
          }}
          aria-expanded={expandedIds.has(message.id)}
        >
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
                {message.direction === "received" &&
                message.isRead === false ? (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "error.main",
                    }}
                  />
                ) : null}
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {message.timestamp
                  ? new Date(message.timestamp).toLocaleString()
                  : "—"}
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ whiteSpace: "pre-line", mt: 1 }}>
              <Box
                component="span"
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: expandedIds.has(message.id) ? "unset" : 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {message.body || "—"}
              </Box>
            </Typography>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
