import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useFetchMeetImages } from "../../hooks/useFetchMeetImages";
import { useCreateMeetImage } from "../../hooks/useCreateMeetImage";
import { useUpdateMeetImage } from "../../hooks/useUpdateMeetImage";
import { useNotistack } from "../../hooks/useNotistack";
import MeetImage from "../../types/MeetImageModel";
import { MeetImageCard } from "./MeetImageCard";
import { HelpBanner } from "./HelpBanner";

type PendingUploadPreview = {
  id: string;
  name: string;
  url: string;
};

type ImageStepProps = {
  meetId?: string | null;
  onImagesChange: (images: MeetImage[]) => void;
  disabled?: boolean;
  isHelpEnabled?: boolean;
  isHelpBannerDismissed?: boolean;
  onDismissHelpBanner?: () => void;
};

function createPreviewId() {
  return (
    crypto.randomUUID?.() ??
    `preview-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function resizeImageFile(file: File): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) {
        resolve(file);
        return;
      }

      const image = new Image();
      image.onload = () => {
        const maxWidth = 640;
        const maxHeight = 480;
        const scale = Math.min(
          maxWidth / image.width,
          maxHeight / image.height,
          1,
        );
        const width = Math.round(image.width * scale);
        const height = Math.round(image.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(image, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            resolve(
              new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
                type: "image/jpeg",
              }),
            );
          },
          "image/jpeg",
          0.6,
        );
      };
      image.onerror = () => resolve(file);
      image.src = result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export const ImageStep = ({
  meetId,
  onImagesChange,
  disabled = false,
  isHelpEnabled = false,
  isHelpBannerDismissed = false,
  onDismissHelpBanner,
}: ImageStepProps) => {
  const {
    data: images,
    isLoading,
    error,
  } = useFetchMeetImages(meetId, Boolean(meetId));
  const { createMeetImageAsync, isLoading: isUploading } = useCreateMeetImage();
  const { updateMeetImageAsync, isLoading: isUpdatingImage } =
    useUpdateMeetImage();
  const { success, error: showError, warn } = useNotistack();
  const [pendingUploads, setPendingUploads] = useState<PendingUploadPreview[]>(
    [],
  );
  const previewUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    onImagesChange(images);
  }, [images, isLoading, onImagesChange]);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = [];
    };
  }, []);

  const clearPendingPreviews = (
    previewIds: string[],
    previewUrls: string[],
  ) => {
    setPendingUploads((prev) =>
      prev.filter((preview) => !previewIds.includes(preview.id)),
    );
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current = previewUrlsRef.current.filter(
      (url) => !previewUrls.includes(url),
    );
  };

  const handleFiles = async (fileList?: FileList | null) => {
    if (disabled) {
      return;
    }
    if (!meetId) {
      warn("Save the basic meet details first before uploading images.");
      return;
    }

    const selectedFiles = Array.from(fileList ?? []);
    if (!selectedFiles.length) {
      return;
    }

    const previews = selectedFiles.map((file) => {
      const url = URL.createObjectURL(file);
      previewUrlsRef.current.push(url);
      return {
        id: createPreviewId(),
        name: file.name,
        url,
      };
    });

    setPendingUploads((prev) => [...prev, ...previews]);

    try {
      const resizedFiles = await Promise.all(
        selectedFiles.map((file) => resizeImageFile(file)),
      );

      for (const resizedFile of resizedFiles) {
        await createMeetImageAsync({ meetId, file: resizedFile });
      }

      success(
        `${selectedFiles.length} image${selectedFiles.length === 1 ? "" : "s"} uploaded`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload images";
      showError(message);
    } finally {
      clearPendingPreviews(
        previews.map((preview) => preview.id),
        previews.map((preview) => preview.url),
      );
    }
  };

  const handleSelectMain = async (imageId: string) => {
    if (!meetId || disabled) {
      return;
    }

    try {
      await updateMeetImageAsync({
        meetId,
        imageId,
        isPrimary: true,
      });
      success("Main image updated");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update main image";
      showError(message);
    }
  };

  const hasImages = images.length > 0 || pendingUploads.length > 0;

  return (
    <Box sx={{ position: "relative" }}>
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Upload one or more images for your meet. The selected main image will
          be used across the app.
        </Typography>
        {!meetId ? (
          <Alert severity="warning">
            Save the basic meet details first before uploading images.
          </Alert>
        ) : null}
        <Button
          variant="outlined"
          component="label"
          disabled={disabled || !meetId || isUploading}
        >
          {isUploading ? "Uploading..." : "Choose images"}
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            disabled={disabled || !meetId || isUploading}
            onChange={(event) => {
              void handleFiles(event.target.files);
              event.currentTarget.value = "";
            }}
          />
        </Button>
        {isHelpEnabled ? (
          <Typography variant="body2" color="text.secondary">
            Try to use clear, attractive photos that help attendees understand
            the meet. You can upload more than one and choose a primary image.
          </Typography>
        ) : null}
        {error ? <Alert severity="error">{error}</Alert> : null}
        {isLoading && !hasImages ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              Loading images...
            </Typography>
          </Stack>
        ) : null}
        {hasImages ? (
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
              },
            }}
          >
            {images.map((image) => (
              <MeetImageCard
                key={image.id}
                image={image}
                disabled={disabled}
                isUpdating={isUpdatingImage}
                onSelectMain={handleSelectMain}
              />
            ))}
            {pendingUploads.map((preview) => (
              <Stack
                key={preview.id}
                spacing={1.5}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: "1px dashed",
                  borderColor: "divider",
                  backgroundColor: "background.paper",
                }}
              >
                <Box
                  component="img"
                  src={preview.url}
                  alt={preview.name}
                  sx={{
                    width: "100%",
                    aspectRatio: "4 / 3",
                    objectFit: "cover",
                    borderRadius: 1.5,
                    border: "1px solid",
                    borderColor: "divider",
                    opacity: 0.72,
                  }}
                />
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary" noWrap>
                    Uploading {preview.name}
                  </Typography>
                </Stack>
              </Stack>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No images uploaded yet.
          </Typography>
        )}
      </Stack>
      {isHelpEnabled && !isHelpBannerDismissed ? (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            p: 1,
            bgcolor: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(1px)",
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 760 }}>
            <HelpBanner
              message="Images help your meet stand out. You can upload photos and other information about to meet to make it more attractive and chose a main image that will be used in previews across the app."
              onDismiss={onDismissHelpBanner || (() => undefined)}
            />
          </Box>
        </Box>
      ) : null}
    </Box>
  );
};
