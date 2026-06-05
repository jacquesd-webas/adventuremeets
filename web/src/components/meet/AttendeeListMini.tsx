import {
  Avatar,
  Box,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Popover,
} from "@mui/material";
import { MeetAttendeePreview } from "../../types/MeetModel";

type AttendeeListMiniProps = {
  attendees: MeetAttendeePreview[];
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  isMobile: boolean;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function AttendeeListMini({
  attendees,
  open,
  anchorEl,
  onClose,
  isMobile,
}: AttendeeListMiniProps) {
  const list = (
    <List sx={{ py: 0 }}>
      {attendees.map((attendee) => (
        <ListItem key={attendee.id} sx={{ py: 0.75 }}>
          <ListItemAvatar sx={{ minWidth: 44 }}>
            <Avatar
              src={attendee.avatarUrl || undefined}
              sx={{ width: 32, height: 32, fontSize: 12 }}
            >
              {getInitials(attendee.name)}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={attendee.name}
            primaryTypographyProps={{ fontWeight: 600, variant: "body2" }}
          />
        </ListItem>
      ))}
    </List>
  );

  const desktopContent = (
    <Paper
      variant="outlined"
      sx={{
        width: 280,
        maxWidth: "calc(100vw - 32px)",
        maxHeight: 320,
        overflowY: "auto",
        boxShadow: "none",
      }}
    >
      <Box sx={{ py: 0.5 }}>{list}</Box>
    </Paper>
  );

  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        slotProps={{
          backdrop: {
            sx: { backgroundColor: "rgba(0,0,0,0.35)" },
          },
        }}
        ModalProps={{
          keepMounted: true,
          disableAutoFocus: true,
          disableEnforceFocus: true,
          disableRestoreFocus: true,
        }}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: "78dvh",
            overflow: "hidden",
            pb: "calc(16px + env(safe-area-inset-bottom))",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            maxHeight: "78dvh",
            px: 2,
            pt: 1.5,
            pb: 1,
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 4,
              borderRadius: 999,
              backgroundColor: "divider",
              mx: "auto",
              mb: 1.5,
            }}
          />
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <Box sx={{ pb: 1 }}>{list}</Box>
          </Box>
          <Box
            sx={{
              pt: 1.5,
              mt: 1,
              display: "flex",
              justifyContent: "flex-end",
              borderTop: 1,
              borderColor: "divider",
              backgroundColor: "background.paper",
            }}
          >
            <Button onClick={onClose}>Close</Button>
          </Box>
        </Box>
      </Drawer>
    );
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
    >
      {desktopContent}
    </Popover>
  );
}
