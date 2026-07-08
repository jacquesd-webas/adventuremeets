import { Box, Stack, Typography } from "@mui/material";
import { MetaValue } from "../../types/MetaValueModel";

type AttendeeResponsesProps = {
  indemnityAccepted?: boolean;
  indemnityMinors?: string | number | null;
  responses?: MetaValue[];
  guestOfLabel?: string | null;
};

export function AttendeeResponses({ responses }: AttendeeResponsesProps) {
  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
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
