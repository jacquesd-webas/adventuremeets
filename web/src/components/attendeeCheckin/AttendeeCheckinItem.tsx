import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
} from "@mui/material";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import UndoOutlinedIcon from "@mui/icons-material/UndoOutlined";

type AttendeeCheckinItemProps = {
  attendee: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  isCheckingIn: boolean;
  isChecked: boolean;
  syncState?: "queued" | "failed";
  syncMessage?: string;
  showDivider: boolean;
  disabled?: boolean;
  onCheckin: (attendeeId: string) => void;
  onUndo: (attendee: { id: string; name: string }) => void;
};

export function AttendeeCheckinItem({
  attendee,
  isCheckingIn,
  isChecked,
  syncState,
  syncMessage,
  showDivider,
  disabled = false,
  onCheckin,
  onUndo,
}: AttendeeCheckinItemProps) {
  return (
    <Box>
      <ListItem
        disableGutters
        secondaryAction={null}
        onClick={disabled ? undefined : () => onCheckin(attendee.id)}
        sx={{
          borderRadius: 1,
          px: 1,
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? "default" : "pointer",
        }}
      >
        <ListItemIcon>
          {isChecked ? (
            <CheckBoxIcon color="success" sx={{ fontSize: 32 }} />
          ) : isCheckingIn ? (
            <CircularProgress size={28} />
          ) : (
            <HelpOutlineIcon color="disabled" sx={{ fontSize: 32 }} />
          )}
        </ListItemIcon>
        <ListItemText
          primary={attendee.name}
          primaryTypographyProps={{
            variant: "subtitle1",
            fontWeight: 600,
          }}
          secondaryTypographyProps={{ component: "div" }}
          secondary={
            <Box sx={{ mt: 0.5 }}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                {attendee.email ? (
                  <Chip size="small" label={attendee.email} color="default" />
                ) : null}
                {attendee.phone ? (
                  <Chip size="small" label={attendee.phone} color="default" />
                ) : null}
                {syncState === "queued" ? (
                  <Chip
                    size="small"
                    label="Pending sync"
                    color="warning"
                    variant="outlined"
                  />
                ) : null}
                {syncState === "failed" ? (
                  <Chip
                    size="small"
                    label={syncMessage || "Sync failed"}
                    color="error"
                    variant="outlined"
                  />
                ) : null}
              </Stack>
            </Box>
          }
        />
        {isChecked ? (
          <IconButton
            edge="end"
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              onUndo(attendee);
            }}
          >
            <UndoOutlinedIcon fontSize="small" />
          </IconButton>
        ) : null}
      </ListItem>
      {showDivider ? <Divider /> : null}
    </Box>
  );
}
