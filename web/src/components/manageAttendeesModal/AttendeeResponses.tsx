import { Box, Stack, Typography } from "@mui/material";

type AttendeeResponsesProps = {
  indemnityAccepted?: boolean;
  indemnityMinors?: string | number | null;
  responses?: Array<{ definitionId?: string; label?: string; value?: string }>;
};

export function AttendeeResponses({
  indemnityAccepted,
  indemnityMinors,
  responses,
}: AttendeeResponsesProps) {
  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Indemnity
      </Typography>
      <Typography variant="body2">
        {indemnityAccepted ? "Accepted" : "Not accepted"}
      </Typography>
      {indemnityMinors ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Minors: {indemnityMinors}
        </Typography>
      ) : null}
      <Box sx={{ borderTop: 1, borderColor: "divider", mt: 2, pt: 2 }} />
      <Typography
        variant="subtitle2"
        color="text.secondary"
        gutterBottom
      >
        Responses
      </Typography>
      {responses?.length ? (
        <Stack spacing={1}>
          {responses.map((response) => (
            <Box key={response.definitionId || response.label}>
              <Typography variant="caption" color="text.secondary">
                {response.label}
              </Typography>
              <Typography variant="body2">{response.value || "—"}</Typography>
            </Box>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No responses available.
        </Typography>
      )}
    </Box>
  );
}
