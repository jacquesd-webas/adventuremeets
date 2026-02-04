import { Button, Stack, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { StepProps, validateAll } from "./CreateMeetState";

type FinishStepProps = StepProps & {
  shareCode?: string | null;
};

export function FinishStep({ errors, shareCode }: FinishStepProps) {
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
      {errors.length > 0 ? (
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            This meet cannot be shared until all necessary fields are completed
            and no errors remain.
          </Typography>

          <ul
            style={{ margin: 0, paddingTop: "1.5rem", paddingLeft: "1.5rem" }}
          >
            {errors.map((error) => (
              <li key={error.field}>
                <Typography variant="body2" color="error">
                  {error.message} (see step {error.step + 1})
                </Typography>
              </li>
            ))}
          </ul>
        </Stack>
      ) : (
        <Typography color="text.secondary">
          Send the link below so attendees can sign up.
        </Typography>
      )}
      {errors.length === 0 && (
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
