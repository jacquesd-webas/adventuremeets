import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import StarOutlineOutlinedIcon from "@mui/icons-material/StarOutlineOutlined";
import { Box, Button, Rating, Stack, TextField, Typography } from "@mui/material";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useCreateWallItem } from "../../hooks/useCreateWallItem";
import { useNotistack } from "../../hooks/useNotistack";

type MeetWallPhotoComposerProps = {
  meetId: string;
  attendeeId?: string;
  allowRating?: boolean;
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
  allowRating = true,
  onCancel,
  onCreated,
}: MeetWallPhotoComposerProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<PhotoPreview[]>([]);
  const [comment, setComment] = useState("");
  const [stars, setStars] = useState<number | null>(0);
  const [showRating, setShowRating] = useState(false);
  const { createWallItemAsync, isLoading } = useCreateWallItem();
  const notice = useNotistack();
  const previewUrlsRef = useRef<string[]>([]);

  const trimmedComment = comment.trim();
  const hasFiles = files.length > 0;
  const hasRating = Boolean(stars);
  const canSubmit = Boolean(hasFiles || trimmedComment || hasRating);
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

  const clearPreviews = () => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current = [];
    setPreviews([]);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []).filter((file) =>
      file.type.startsWith("image/"),
    );
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
    event.target.value = "";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    try {
      if (files.length > 0) {
        if (hasRating) {
          await createWallItemAsync({
            meetId,
            attendeeId,
            comment: trimmedComment || undefined,
            stars: stars || undefined,
          });
        }

        for (const [index, file] of files.entries()) {
          await createWallItemAsync({
            meetId,
            attendeeId,
            file,
            comment:
              !hasRating && index === 0 ? trimmedComment || undefined : undefined,
            stars: undefined,
          });
        }
      } else {
        await createWallItemAsync({
          meetId,
          attendeeId,
          comment: trimmedComment || undefined,
          stars: stars || undefined,
        });
      }
      clearPreviews();
      setFiles([]);
      setComment("");
      setStars(0);
      setShowRating(false);
      notice.success("Post added");
      onCreated();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to add post";
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
        label="Add Post"
        placeholder="Share your thoughts about the meet"
        value={comment}
        onChange={(event) => {
          setComment(event.target.value);
        }}
        autoFocus
        fullWidth
      />
      <Stack spacing={0.75}>
        <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
          <Button
            component="label"
            variant="outlined"
            startIcon={<AddPhotoAlternateOutlinedIcon fontSize="small" />}
            disabled={isLoading}
          >
            Choose Photos
            <input
              hidden
              multiple
              accept="image/*"
              type="file"
              onChange={handleFileChange}
            />
          </Button>
          <Typography variant="body2" color="text.secondary">
            {helperLabel}
          </Typography>
        </Stack>
        {allowRating ? (
          <Stack spacing={0.75}>
            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
              <Button
                type="button"
                variant={showRating ? "contained" : "outlined"}
                startIcon={<StarOutlineOutlinedIcon fontSize="small" />}
                disabled={isLoading}
                onClick={() => {
                  setShowRating((current) => {
                    const next = !current;
                    if (!next) {
                      setStars(0);
                    }
                    return next;
                  });
                }}
              >
                Rate
              </Button>
              {showRating && stars ? (
                <Typography variant="body2" color="text.secondary">
                  {`${stars} star${stars === 1 ? "" : "s"}`}
                </Typography>
              ) : null}
            </Stack>
            {showRating ? (
              <Rating
                name="meet-wall-rating"
                value={stars}
                onChange={(_event, value) => {
                  setStars(value);
                }}
              />
            ) : null}
          </Stack>
        ) : null}
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
        <Button type="submit" variant="contained" disabled={!canSubmit || isLoading}>
          Post
        </Button>
      </Stack>
    </Stack>
  );
}

export default MeetWallPhotoComposer;
