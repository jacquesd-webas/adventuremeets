import { useEffect, useState } from "react";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { CreateMeetState } from "./CreateMeetState";
import { useIndemnityTemplate } from "../../hooks/useIndemnityTemplate";

type Props = {
  meetId?: string | null;
  disabled?: boolean;
  setState: (fn: (prev: CreateMeetState) => CreateMeetState) => void;
};

export function IndemnityPdfUpload({ meetId, disabled, setState }: Props) {
  const { template, preview, isLoadingPreview, previewError, upload } =
    useIndemnityTemplate(meetId);
  const [message, setMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!preview) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(preview);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [preview]);

  const handleFile = async (file?: File) => {
    if (!file) return;
    setMessage(null);
    try {
      const result = await upload.mutateAsync(file);
      setState((prev) => ({
        ...prev,
        requireEmail: true,
        questions: [
          ...prev.questions.filter((question) => !question.pdfFormFieldId),
          ...result.questions.map((question) => ({
            id: question.id,
            fieldKey: question.fieldKey,
            pdfFormFieldId: question.pdfFormFieldId,
            type: question.fieldType,
            category: "P" as const,
            label: question.label,
            required: question.required,
            includeInReports: false,
            options: question.config.options,
            optionsInput: question.config.options?.join(", ") || "",
          })),
        ],
      }));
      setMessage(
        `${result.questions.length} form questions created. Review the questions in the next step.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not upload the PDF",
      );
    }
  };

  const fileInput = (
    <input
      hidden
      type="file"
      accept="application/pdf,.pdf"
      onChange={(event) => {
        void handleFile(event.target.files?.[0]);
        event.target.value = "";
      }}
    />
  );

  return (
    <Stack spacing={1}>
      {template?.filename ? (
        <Typography variant="body2">Uploaded: {template.filename}</Typography>
      ) : null}
      {template?.filename ? (
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: 216,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            overflow: "hidden",
          }}
        >
          {previewUrl ? (
            <iframe
              title="Indemnity PDF preview"
              src={`${previewUrl}#toolbar=0&navpanes=0&page=1&view=FitH`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
            />
          ) : (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{ height: "100%" }}
            >
              <Typography variant="body2" color="text.secondary">
                {isLoadingPreview
                  ? "Loading PDF preview…"
                  : previewError
                    ? "Preview unavailable"
                    : "PDF preview"}
              </Typography>
            </Stack>
          )}
          <Button
            variant="contained"
            component="label"
            size="small"
            disabled={disabled || upload.isPending}
            sx={{ position: "absolute", top: 8, right: 8 }}
          >
            {upload.isPending ? "Processing PDF…" : "Replace PDF"}
            {fileInput}
          </Button>
        </Box>
      ) : (
        <Button
          variant="outlined"
          component="label"
          fullWidth
          disabled={disabled || !meetId || upload.isPending}
          sx={{ minHeight: 216, textTransform: "none" }}
        >
          {upload.isPending ? "Processing PDF…" : "Upload PDF"}
          {fileInput}
        </Button>
      )}
      {message ? (
        <Alert severity={upload.isError ? "error" : "success"}>{message}</Alert>
      ) : null}
    </Stack>
  );
}
