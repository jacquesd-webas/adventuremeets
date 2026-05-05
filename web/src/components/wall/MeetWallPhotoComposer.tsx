import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCreateWallItem } from "../../hooks/useCreateWallItem";
import { useNotistack } from "../../hooks/useNotistack";

type MeetWallPhotoComposerProps = {
  meetId: string;
  attendeeId?: string;
  initialFiles?: File[];
  onCancel: () => void;
  onCreated: () => void;
};

type PhotoPreview = {
  id: string;
  name: string;
  url: string;
};

function createPreviewId() {
  return (
    crypto.randomUUID?.() ??
    `preview-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

export function MeetWallPhotoComposer({
  meetId,
  attendeeId,
  initialFiles,
  onCancel,
  onCreated,
}: MeetWallPhotoComposerProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<PhotoPreview[]>([]);
  const [comment, setComment] = useState("");
  const { createWallItemAsync, isLoading } = useCreateWallItem();
  const notice = useNotistack();
  const previewUrlsRef = useRef<string[]>([]);

  const trimmedComment = comment.trim();
  const hasFiles = files.length > 0;
  const canSubmit = hasFiles;
  const helperLabel = useMemo(() => {
    if (!files.length) return "No photos selected";
    if (files.length === 1) return files[0].name;
    return `${files.length} photos selected`;
  }, [files]);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = [];
    };
  }, []);

  const clearPreviews = useCallback(() => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current = [];
    setPreviews([]);
  }, []);

  const applyFiles = useCallback((selectedFiles: File[]) => {
    clearPreviews();
    setFiles(selectedFiles);
    setPreviews(
      selectedFiles.map((file) => {
        const url = URL.createObjectURL(file);
        previewUrlsRef.current.push(url);
        return {
          id: createPreviewId(),
          name: file.name,
          url,
        };
      }),
    );
  }, [clearPreviews]);

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      applyFiles(initialFiles);
    } else {
      clearPreviews();
    }
  }, [applyFiles, clearPreviews, initialFiles]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    try {
      for (const [index, file] of files.entries()) {
        await createWallItemAsync({
          meetId,
          attendeeId,
          file,
          comment: index === 0 ? trimmedComment || undefined : undefined,
          stars: undefined,
        });
      }
      clearPreviews();
      setFiles([]);
      setComment("");
      notice.success("Photos added");
      onCreated();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to add photos";
      notice.error(message);
    }
  };

  return (
    <Stack
      component="form"
      spacing={1.5}
      onSubmit={handleSubmit}
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        p: 2,
        backgroundColor: "background.paper",
      }}
    >
      <TextField
        multiline
        minRows={3}
        label="Add Photos"
        placeholder="Add a comment with your photos"
        value={comment}
        onChange={(event) => {
          setComment(event.target.value);
        }}
        autoFocus
        fullWidth
      />
      <Stack spacing={0.75}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          useFlexGap
          flexWrap="wrap"
        >
          <AddPhotoAlternateOutlinedIcon fontSize="small" />
          <Typography variant="body2" color="text.secondary">
            {helperLabel}
          </Typography>
        </Stack>
        {previews.length ? (
          <Box
            sx={{
              display: "grid",
              gap: 1,
              gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))",
            }}
          >
            {previews.map((preview) => (
              <Box key={preview.id} sx={{ minWidth: 0 }}>
                <Box
                  component="img"
                  src={preview.url}
                  alt={preview.name}
                  sx={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    objectFit: "cover",
                    display: "block",
                    borderRadius: 1.5,
                    border: "1px solid",
                    borderColor: "divider",
                    backgroundColor: "grey.100",
                  }}
                />
              </Box>
            ))}
          </Box>
        ) : null}
      </Stack>
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button variant="text" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={!canSubmit || isLoading}
        >
          Post Photos
        </Button>
      </Stack>
    </Stack>
  );
}

export default MeetWallPhotoComposer;
