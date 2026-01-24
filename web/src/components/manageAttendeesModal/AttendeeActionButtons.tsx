import { Button, ButtonGroup } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import AttendeeStatusEnum from "../../types/AttendeeStatusEnum";

type AttendeeActionButtonsProps = {
  attendee?: any | null;
  disabled?: boolean;
  onUpdateStatus: (status: AttendeeStatusEnum) => void;
  onPaid?: () => void;
};

export function AttendeeActionButtons({
  attendee,
  onUpdateStatus,
  onPaid,
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
        {attendee?.status !== "confirmed" && (
          <Button
            color="success"
            onClick={() => onUpdateStatus(AttendeeStatusEnum.Confirmed)}
          >
            Accept
          </Button>
        )}
        {onPaid && attendee?.status === "confirmed" && (
          <Button color="primary" onClick={onPaid}>
            Paid
          </Button>
        )}
        {attendee?.status !== "rejected" ? (
          <Button
            color="error"
            onClick={() => onUpdateStatus(AttendeeStatusEnum.Rejected)}
          >
            Reject
          </Button>
        ) : null}
        {attendee?.status !== "waitlisted" ? (
          <Button
            color="warning"
            onClick={() => onUpdateStatus(AttendeeStatusEnum.Waitlisted)}
          >
            Waitlist
          </Button>
        ) : null}
      </ButtonGroup>
    </>
  );
}
