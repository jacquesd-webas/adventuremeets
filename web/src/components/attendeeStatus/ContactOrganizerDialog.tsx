import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import Meet from "../../types/MeetModel";

type ContactOrganizerDialogProps = {
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
  meet: Meet;
};

export function ContactOrganizerDialog({
  open,
  onClose,
  isMobile,
  meet,
}: ContactOrganizerDialogProps) {
  const content = (
    <>
      <Stack spacing={1}>
        <Typography variant="body1" fontWeight="bold">
          {meet.organizerName || "Organizer"}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <EmailOutlinedIcon fontSize="small" />
          {meet.organizerEmail ? (
            <Link
              href={`mailto:${meet.organizerEmail}`}
              variant="body2"
              underline="hover"
            >
              {meet.organizerEmail}
            </Link>
          ) : (
            <Typography variant="body2">Not available</Typography>
          )}
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <PhoneOutlinedIcon fontSize="small" />
          {meet.organizerPhone ? (
            <Link
              href={`tel:${meet.organizerPhone}`}
              variant="body2"
              underline="hover"
            >
              {meet.organizerPhone}
            </Link>
          ) : (
            <Typography variant="body2">Not available</Typography>
          )}
        </Stack>
      </Stack>
    </>
  );

  if (isMobile) {
    return (
      <Drawer anchor="bottom" open={open} onClose={onClose}>
        <Box sx={{ p: 2 }}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle1">Contact Organiser</Typography>
            {content}
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={onClose}>Close</Button>
            </Box>
          </Stack>
        </Box>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Contact Organiser</DialogTitle>
      <DialogContent dividers>{content}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
