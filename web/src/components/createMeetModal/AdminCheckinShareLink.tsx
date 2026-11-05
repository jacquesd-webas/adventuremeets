import { Button, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useAdminShareCode } from "../../hooks/useAdminShareCode";

type AdminCheckinShareLinkProps = {
  meetId: string;
  shareCode: string;
};

export function AdminCheckinShareLink({
  meetId,
  shareCode,
}: AdminCheckinShareLinkProps) {
  const { data } = useAdminShareCode(meetId);
  const [copied, setCopied] = useState(false);
  if (!data?.adminShareCode) return null;

  const link = `${window.location.origin}/meets/${shareCode}/checkin?adminShareCode=${encodeURIComponent(data.adminShareCode)}`;
  const handleCopy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">Helper check-in link</Typography>
      <Typography variant="body2" color="text.secondary">
        Anyone with this link can check in attendees. Share it only with
        helpers.
      </Typography>
      <TextField
        value={link}
        fullWidth
        size="small"
        InputProps={{ readOnly: true }}
        inputProps={{ "aria-label": "Helper check-in link" }}
      />
      <Button variant="outlined" onClick={() => void handleCopy()}>
        {copied ? "Copied" : "Copy helper link"}
      </Button>
    </Stack>
  );
}
