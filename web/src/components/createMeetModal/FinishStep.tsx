import { Button, Stack, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";

type FinishStepProps = {
  shareCode?: string | null;
  missingFields?: string[];
};

export function FinishStep({ shareCode, missingFields = [] }: FinishStepProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = useMemo(() => {
    if (!shareCode) return "";
    if (typeof window === "undefined") return `/meets/${shareCode}`;
    return `${window.location.origin}/meets/${shareCode}`;
  }, [shareCode]);

  const handleCopy = async () => {
    if (!shareUrl || typeof navigator === "undefined") return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Share this meet</Typography>
      {missingFields.length > 0 ? (
        <Stack spacing={1}>
          <Typography color="error" sx={{ mb: 1 }}>
            This meet cannot be shared until all the required fields are
            complete.
          </Typography>

          <Typography color="text.secondary">
            Still missing these:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
            {missingFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </Stack>
      ) : (
        <Typography color="text.secondary">
          Send the link below so attendees can sign up.
        </Typography>
      )}
      {missingFields.length === 0 && (
        <>
          <TextField
            value={shareUrl}
            fullWidth
            InputProps={{ readOnly: true }}
          />
          <Button variant="contained" onClick={handleCopy} disabled={!shareUrl}>
            {copied ? "Copied" : "Copy link"}
          </Button>
        </>
      )}
    </Stack>
  );
}
