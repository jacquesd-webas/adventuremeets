import { useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Meet from "../../types/MeetModel";
import {
  useMeetWhatsappChats,
  useSendMeetWhatsapp,
  WhatsappChat,
} from "../../hooks/useMeetWhatsapp";
import { useNotistack } from "../../hooks/useNotistack";
import { meetShareImageUrl, meetShareMessage } from "./meetShareMessage";

type MeetWhatsappComposerProps = {
  meet: Meet;
  onClose: () => void;
};

export function MeetWhatsappComposer({
  meet,
  onClose,
}: MeetWhatsappComposerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const notice = useNotistack();
  const {
    data: chats = [],
    isLoading,
    error,
    refetch,
  } = useMeetWhatsappChats(meet.id);
  const send = useSendMeetWhatsapp(meet.id);
  const imageUrl = meetShareImageUrl(meet);
  const [recipient, setRecipient] = useState<WhatsappChat | null>(null);
  const [message, setMessage] = useState(() =>
    meetShareMessage(
      meet,
      `${window.location.origin}/share/${meet.shareCode}`,
      "whatsapp",
      Boolean(imageUrl),
    ),
  );
  const [includeImage, setIncludeImage] = useState(Boolean(imageUrl));

  const handleSend = async () => {
    if (!recipient || !message.trim()) return;
    try {
      await send.mutateAsync({
        chatId: recipient.id,
        message: message.trim(),
        includeImage,
      });
      notice.success(`Sent to ${recipient.name}`);
      onClose();
    } catch {
      // The mutation error is shown below; the send may have reached WhatsApp.
    }
  };

  const content = (
    <Stack spacing={2} sx={{ pt: 1, minWidth: isMobile ? 0 : 420 }}>
      <Typography variant="body2" color="text.secondary">
        Send from the organisation's linked WhatsApp number to one existing chat
        or group.
      </Typography>
      <Autocomplete
        options={chats}
        value={recipient}
        onChange={(_, value) => setRecipient(value)}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            {option.name} {option.isGroup ? "(Group)" : "(Chat)"}
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Send to"
            placeholder="Search chats and groups"
          />
        )}
        loading={isLoading}
        noOptionsText={isLoading ? "Loading chats…" : "No chats found"}
      />
      {error ? (
        <Alert
          severity="error"
          action={<Button onClick={() => refetch()}>Retry</Button>}
        >
          Unable to load chats. Check that the organisation's WhatsApp is
          connected.
        </Alert>
      ) : null}
      <TextField
        label="Message"
        multiline
        minRows={7}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        inputProps={{ maxLength: 3000 }}
        helperText={`${message.length}/3000 characters`}
      />
      {imageUrl ? (
        <Stack spacing={1}>
          <FormControlLabel
            control={
              <Checkbox
                checked={includeImage}
                onChange={(event) => setIncludeImage(event.target.checked)}
              />
            }
            label="Include primary image"
          />
          {includeImage ? (
            <Box
              component="img"
              src={imageUrl}
              alt="Meet primary image"
              sx={{
                width: "100%",
                maxHeight: 220,
                objectFit: "cover",
                borderRadius: 1,
              }}
            />
          ) : null}
        </Stack>
      ) : null}
      {send.error ? (
        <Alert severity="error">
          Could not confirm the message was sent. Check the linked phone before
          trying again.
        </Alert>
      ) : null}
    </Stack>
  );

  const actions = (
    <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ p: 2 }}>
      <Button onClick={onClose} disabled={send.isPending}>
        Cancel
      </Button>
      <Button
        variant="contained"
        onClick={handleSend}
        disabled={!recipient || !message.trim() || send.isPending}
      >
        {send.isPending ? "Sending…" : "Send WhatsApp message"}
      </Button>
    </Stack>
  );

  return isMobile ? (
    <Drawer
      anchor="bottom"
      open
      onClose={send.isPending ? undefined : onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          maxHeight: "95vh",
          overflowY: "auto",
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">Share on WhatsApp</Typography>
        {content}
        {actions}
      </Box>
    </Drawer>
  ) : (
    <Dialog
      open
      onClose={send.isPending ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Share on WhatsApp</DialogTitle>
      <DialogContent>{content}</DialogContent>
      <DialogActions>{actions}</DialogActions>
    </Dialog>
  );
}
