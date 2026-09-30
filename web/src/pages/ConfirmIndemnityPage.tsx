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
import { useMutation } from "@tanstack/react-query";
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
  const token = searchParams.get("token") || "";
  const { data: meet, isLoading: isMeetLoading } = useFetchMeetSignup(code);

  const confirmation = useMutation({
    mutationFn: () =>
      api.post(`/meets/${code}/attendees/${attendeeId}/confirm-indemnity`, {
        token,
      }),
    onSuccess: () => setConfirmed(true),
  });

  const statusUrl = code && attendeeId ? `/meets/${code}/${attendeeId}` : "/";

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper variant="outlined" sx={{ p: 4 }}>
        <Stack spacing={3} alignItems="stretch">
          <Typography variant="h5" component="h1">
            Confirm indemnity acceptance
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
              Your indemnity acceptance has been confirmed.
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
          ) : (
            <Typography>
              Confirm that you accepted the indemnity when signing up for this
              meet.
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
                  !token || !code || !attendeeId || confirmation.isPending
                }
                onClick={() => confirmation.mutate()}
              >
                {confirmation.isPending
                  ? "Confirming…"
                  : "Confirm indemnity acceptance"}
              </Button>
            )}
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}
