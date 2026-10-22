import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useSignedIndemnityPdf } from "../../hooks/useSignedIndemnityPdf";

type Props = {
  open: boolean;
  onClose: () => void;
  meetId: string;
  attendeeId: string;
};

export function AttendeeSignedIndemnityPdf({
  open,
  onClose,
  meetId,
  attendeeId,
}: Props) {
  const { data, isLoading, isError } = useSignedIndemnityPdf(
    meetId,
    attendeeId,
    open,
  );
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    const objectUrl = URL.createObjectURL(data);
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
      setUrl(null);
    };
  }, [data]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Signed indemnity form</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <CircularProgress aria-label="Loading signed indemnity" />
        ) : null}
        {isError ? (
          <Alert severity="error">
            Could not load the signed indemnity form.
          </Alert>
        ) : null}
        {url ? (
          <Box
            component="iframe"
            title="Signed indemnity form"
            src={url}
            sx={{ width: "100%", height: "75vh", border: 0 }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
