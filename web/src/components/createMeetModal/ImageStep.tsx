import { Box, Button, Stack, Typography } from "@mui/material";
import { StepProps } from "./CreateMeetState";

export const ImageStep = ({ state, setState }: StepProps) => {
  const handleFile = (file?: File | null) => {
    if (!file) {
      setState((prev) => ({ ...prev, imageFile: null, imagePreview: "" }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) {
        setState((prev) => ({ ...prev, imageFile: null, imagePreview: "" }));
        return;
      }
      const image = new Image();
      image.onload = () => {
        const maxWidth = 640;
        const maxHeight = 480;
        const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
        const width = Math.round(image.width * scale);
        const height = Math.round(image.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setState((prev) => ({ ...prev, imageFile: file, imagePreview: result }));
          return;
        }
        ctx.drawImage(image, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              setState((prev) => ({ ...prev, imageFile: file, imagePreview: result }));
              return;
            }
            const resizedFile = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
            const previewUrl = URL.createObjectURL(blob);
            setState((prev) => ({ ...prev, imageFile: resizedFile, imagePreview: previewUrl }));
          },
          "image/jpeg",
          0.6
        );
      };
      image.src = result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Upload a small image to represent your meet. This will be stored as base64.
      </Typography>
      <Button variant="outlined" component="label">
        Choose image
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </Button>
      {state.imagePreview && (
        <Box
          component="img"
          src={state.imagePreview}
          alt="Meet preview"
          sx={{ width: "100%", maxWidth: 420, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
        />
      )}
    </Stack>
  );
};
