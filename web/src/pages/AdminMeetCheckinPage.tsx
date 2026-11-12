import {
  Alert,
  Box,
  Container,
  List,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { AttendeeCheckinItem } from "../components/attendeeCheckin/AttendeeCheckinItem";
import { CheckinSearch } from "../components/attendeeCheckin/CheckinSearch";
import { useAdminMeetCheckin } from "../hooks/useAdminMeetCheckin";

export default function AdminMeetCheckinPage() {
  const { id: meetId, code: meetCode } = useParams<{
    id?: string;
    code?: string;
  }>();
  const id = meetId || meetCode;
  const [searchParams] = useSearchParams();
  const code = searchParams.get("adminShareCode") || "";
  const [search, setSearch] = useState("");
  const { query, mutation } = useAdminMeetCheckin(id, code);
  const attendees = (query.data?.attendees || []).filter((attendee) =>
    attendee.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <Container maxWidth="sm" sx={{ py: 2, height: "100vh" }}>
      <Stack spacing={2} sx={{ height: "100%" }}>
        <Typography variant="h5" fontWeight={700}>
          {query.data?.meetName || "Meet"} Check-in
        </Typography>
        {!code || query.isError ? (
          <Alert severity="error">
            This check-in link is invalid or unavailable.
          </Alert>
        ) : null}
        {mutation.isError ? (
          <Alert severity="error">
            Could not check in this attendee. Please try again.
          </Alert>
        ) : null}
        {query.data ? (
          <>
            <CheckinSearch
              value={search}
              onChange={setSearch}
              onClear={() => setSearch("")}
            />
            <Paper variant="outlined" sx={{ flex: 1, overflowY: "auto", p: 1 }}>
              {attendees.length ? (
                <List>
                  {attendees.map((attendee, index) => (
                    <AttendeeCheckinItem
                      key={attendee.id}
                      attendee={{
                        id: attendee.id,
                        name: attendee.name || "Unnamed attendee",
                        email: "",
                        phone: "",
                        tags: attendee.tags,
                      }}
                      isCheckingIn={
                        mutation.isPending && mutation.variables === attendee.id
                      }
                      isChecked={attendee.status !== "confirmed"}
                      showDivider={index < attendees.length - 1}
                      disabled={
                        attendee.status !== "confirmed" || mutation.isPending
                      }
                      onCheckin={(attendeeId) => mutation.mutate(attendeeId)}
                      onUndo={() => undefined}
                    />
                  ))}
                </List>
              ) : (
                <Box sx={{ p: 2 }}>No attendees found.</Box>
              )}
            </Paper>
          </>
        ) : query.isLoading ? (
          <Typography color="text.secondary">Loading attendees...</Typography>
        ) : null}
      </Stack>
    </Container>
  );
}
