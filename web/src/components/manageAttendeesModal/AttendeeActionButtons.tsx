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
  const isCheckedIn =
    attendee?.status === AttendeeStatusEnum.CheckedIn ||
    attendee?.status === AttendeeStatusEnum.Attended;
  const isWithdrawn = attendee?.status === AttendeeStatusEnum.Cancelled;

  return (
    <>
      {(attendee?.responded_at || isCheckedIn || isWithdrawn) && (
        <LockIcon
          fontSize="small"
          color="disabled"
          sx={{ mr: 1, alignSelf: "center" }}
        />
      )}
      {isCheckedIn ? (
        <Button color="success" variant="outlined" size="small">
          Checked In
        </Button>
      ) : isWithdrawn ? (
        <Button color="error" variant="outlined" size="small">
          Withdrawn
        </Button>
      ) : (
        <ButtonGroup
          variant="outlined"
          size="small"
          disabled={disabled}
          aria-label="Update attendee status"
        >
          {attendee?.status !== AttendeeStatusEnum.Confirmed && (
            <Button
              color="success"
              onClick={() => onUpdateStatus(AttendeeStatusEnum.Confirmed)}
            >
              Accept
            </Button>
          )}
          {onPaid && attendee?.status === AttendeeStatusEnum.Confirmed && (
            <Button
              color="primary"
              onClick={() => {
                alert("Not implemented!");
              }}
            >
              Paid
            </Button>
          )}
          {attendee?.status !== AttendeeStatusEnum.Rejected ? (
            <Button
              color="error"
              onClick={() => onUpdateStatus(AttendeeStatusEnum.Rejected)}
            >
              Reject
            </Button>
          ) : null}
          {attendee?.status !== AttendeeStatusEnum.Waitlisted ? (
            <Button
              color="warning"
              onClick={() => onUpdateStatus(AttendeeStatusEnum.Waitlisted)}
            >
              Waitlist
            </Button>
          ) : null}
        </ButtonGroup>
      )}
    </>
  );
}
