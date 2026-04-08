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
  showDivider: boolean;
  onCheckin: (attendeeId: string) => void;
  onUndo: (attendee: { id: string; name: string }) => void;
};

export function AttendeeCheckinItem({
  attendee,
  isCheckingIn,
  isChecked,
  showDivider,
  onCheckin,
  onUndo,
}: AttendeeCheckinItemProps) {
  return (
    <Box>
      <ListItem
        disableGutters
        secondaryAction={null}
        onClick={() => onCheckin(attendee.id)}
        sx={{ borderRadius: 1, px: 1 }}
      >
        <ListItemIcon>
          {isCheckingIn ? (
            <CircularProgress size={28} />
          ) : isChecked ? (
            <CheckBoxIcon color="success" sx={{ fontSize: 32 }} />
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
              </Stack>
            </Box>
          }
        />
        {isChecked ? (
          <IconButton edge="end" onClick={() => onUndo(attendee)}>
            <UndoOutlinedIcon fontSize="small" />
          </IconButton>
        ) : null}
      </ListItem>
      {showDivider ? <Divider /> : null}
    </Box>
  );
}
