import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { useFetchMeetSignup } from "../hooks/useFetchMeetSignup";

export default function ConfirmIndemnityPage() {
  const { code, attendeeId } = useParams<{
    code: string;
    attendeeId: string;
  }>();
  const [searchParams] = useSearchParams();
  const [confirmed, setConfirmed] = useState(false);
  const api = useApi();
  const queryClient = useQueryClient();
  const token = searchParams.get("token") || "";
  const isAcceptanceRequest = searchParams.get("request") === "1";
  const { data: meet, isLoading: isMeetLoading } = useFetchMeetSignup(code);

  const confirmation = useMutation({
    mutationFn: () =>
      api.post(`/meets/${code}/attendees/${attendeeId}/confirm-indemnity`, {
        token,
      }),
    onSuccess: () => {
      setConfirmed(true);
      void queryClient.invalidateQueries({
        queryKey: ["attendee-status", attendeeId],
      });
      if (meet?.id) {
        void queryClient.invalidateQueries({
          queryKey: ["meet-attendees", meet.id],
        });
      }
    },
  });

  const statusUrl = code && attendeeId ? `/meets/${code}/${attendeeId}` : "/";

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper variant="outlined" sx={{ p: 4 }}>
        <Stack spacing={3} alignItems="stretch">
          <Typography variant="h5" component="h1">
            {isAcceptanceRequest
              ? "Accept indemnity"
              : "Confirm indemnity acceptance"}
          </Typography>
          <Stack spacing={1}>
            <Typography variant="subtitle1" component="h2" fontWeight={600}>
              Indemnity
            </Typography>
            <Alert
              severity="warning"
              icon={false}
              sx={{ whiteSpace: "pre-line" }}
            >
              {isMeetLoading
                ? "Loading indemnity…"
                : meet?.indemnity || "Indemnity details not available."}
            </Alert>
          </Stack>
          {confirmed ? (
            <Alert severity="success">
              {isAcceptanceRequest
                ? "Your indemnity acceptance has been recorded."
                : "Your indemnity acceptance has been confirmed."}
            </Alert>
          ) : confirmation.isError ? (
            <Alert severity="error">
              {confirmation.error instanceof Error
                ? confirmation.error.message
                : "This confirmation link is invalid or has expired."}
            </Alert>
          ) : !token || !code || !attendeeId ? (
            <Alert severity="error">
              This confirmation link is incomplete.
            </Alert>
          ) : isAcceptanceRequest && !isMeetLoading && !meet?.indemnity ? (
            <Alert severity="error">Indemnity details are not available.</Alert>
          ) : (
            <Typography>
              {isAcceptanceRequest
                ? "Please read the indemnity above before accepting it."
                : "Confirm that you accepted the indemnity when signing up for this meet."}
            </Typography>
          )}
          <Box>
            {confirmed ? (
              <Button component={Link} to={statusUrl} variant="contained">
                Show your status
              </Button>
            ) : (
              <Button
                variant="contained"
                disabled={
                  !token ||
                  !code ||
                  !attendeeId ||
                  confirmation.isPending ||
                  (isAcceptanceRequest && (isMeetLoading || !meet?.indemnity))
                }
                onClick={() => confirmation.mutate()}
              >
                {confirmation.isPending
                  ? "Confirming…"
                  : isAcceptanceRequest
                    ? "I accept the indemnity"
                    : "Confirm indemnity acceptance"}
              </Button>
            )}
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}
