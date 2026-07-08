import { Alert, Avatar, Box, Button, Stack, Typography } from "@mui/material";
import { useMemo, useState, type ChangeEvent } from "react";
import { useAuth } from "../../context/authContext";
import { useUploadMyAvatar } from "../../hooks/useUploadMyAvatar";
import { useNotistack } from "../../hooks/useNotistack";

export function ProfileAvatar() {
  const { user } = useAuth();
  const { success } = useNotistack();
  const {
    uploadMyAvatarAsync,
    isLoading: isAvatarSaving,
    error: avatarSaveError,
  } = useUploadMyAvatar();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarSaved, setAvatarSaved] = useState(false);

  const initials = useMemo(() => {
    const name = [user?.firstName, user?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (!name) return user?.email?.slice(0, 2)?.toUpperCase() || "AM";
    const parts = name.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [user?.email, user?.firstName, user?.lastName]);

  const currentAvatarSrc = avatarPreview || user?.avatarUrl || undefined;

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
    void uploadMyAvatarAsync({ file })
      .then(() => {
        success("Avatar updated");
        setAvatarSaved(true);
        setAvatarPreview(null);
        window.setTimeout(() => setAvatarSaved(false), 1500);
      })
      .catch(() => undefined);
  };

  return (
    <Stack
      spacing={2}
      sx={{ minHeight: 320, display: "flex" }}
      alignItems="flex-start"
    >
      <Box>
        <Typography variant="h6">Avatar</Typography>
        <Typography variant="body2" color="text.secondary">
          Upload a profile picture.
        </Typography>
      </Box>
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar src={currentAvatarSrc} sx={{ width: 64, height: 64 }}>
          {initials}
        </Avatar>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Upload an image to use as your avatar.
          </Typography>
          <Button
            variant="outlined"
            component="label"
            disabled={isAvatarSaving}
          >
            Choose file
            <input
              hidden
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
            />
          </Button>
          {avatarSaved ? (
            <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
              Avatar saved
            </Typography>
          ) : null}
          {avatarSaveError ? (
            <Alert severity="error" sx={{ mt: 1 }}>
              {avatarSaveError}
            </Alert>
          ) : null}
        </Box>
      </Stack>
      <Box sx={{ flexGrow: 1 }} />
    </Stack>
  );
}
