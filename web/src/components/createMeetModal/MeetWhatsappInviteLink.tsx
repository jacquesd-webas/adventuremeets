import { Button, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useMeetWhatsappInviteLink } from "../../hooks/useMeetWhatsapp";

export function MeetWhatsappInviteLink({ meetId }: { meetId: string }) {
  const { data, isLoading, isError, refetch } =
    useMeetWhatsappInviteLink(meetId);
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    if (!data?.url) return;
    await navigator.clipboard.writeText(data.url);
    setCopied(true);
  };

  if (isLoading) {
    return (
      <Typography variant="body2">Loading group invite link...</Typography>
    );
  }
  if (isError || !data?.url) {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="body2" color="text.secondary">
          Could not load the group invite link.
        </Typography>
        <Button size="small" onClick={() => void refetch()}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }}>
      <TextField
        label="Group invite link"
        value={data.url}
        fullWidth
        size="small"
        InputProps={{ readOnly: true }}
      />
      <Button
        variant="outlined"
        onClick={() => void copyLink()}
        sx={{ whiteSpace: "nowrap" }}
      >
        {copied ? "Copied" : "Copy link"}
      </Button>
    </Stack>
  );
}
