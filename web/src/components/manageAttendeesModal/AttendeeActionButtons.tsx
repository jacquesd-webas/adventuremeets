import { Button, ButtonGroup } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";

type AttendeeActionButtonsProps = {
  attendee?: any | null;
  disabled?: boolean;
  onUpdateStatus: (status: "confirmed" | "rejected" | "waitlisted") => void;
};

export function AttendeeActionButtons({
  attendee,
  onUpdateStatus,
}: AttendeeActionButtonsProps) {
  const disabled = attendee == null;

  return (
    <>
      {attendee?.responded_at && (
        <LockIcon
          fontSize="small"
          color="disabled"
          sx={{ mr: 1, alignSelf: "center" }}
        />
      )}
      <ButtonGroup
        variant="outlined"
        size="small"
        disabled={disabled}
        aria-label="Update attendee status"
      >
        {attendee?.status === "confirmed" ? (
          <Button color="success" onClick={() => onUpdateStatus("confirmed")}>
            Confirm
          </Button>
        ) : attendee?.status !== "confirmed" ? (
          <Button color="success" onClick={() => onUpdateStatus("confirmed")}>
            Accept
          </Button>
        ) : null}
        {attendee?.status !== "rejected" ? (
          <Button color="error" onClick={() => onUpdateStatus("rejected")}>
            Reject
          </Button>
        ) : null}
        {attendee?.status !== "waitlisted" ? (
          <Button color="warning" onClick={() => onUpdateStatus("waitlisted")}>
            Waitlist
          </Button>
        ) : null}
      </ButtonGroup>
    </>
  );
}
