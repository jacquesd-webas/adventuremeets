import { Alert, Button, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AttendeeStatusEnum from "../../types/AttendeeStatusEnum";
import { useAttendeeRsvp } from "../../hooks/useAttendeeRsvp";
import { useNotistack } from "../../hooks/useNotistack";

type AttendeeRsvpProps = {
  meetCode?: string | null;
  attendeeId?: string | null;
  status?: AttendeeStatusEnum | null;
};

export function AttendeeRsvp({
  meetCode,
  attendeeId,
  status,
}: AttendeeRsvpProps) {
  const navigate = useNavigate();
  const { confirmAttendeeAsync, declineAttendeeAsync, isLoading } =
    useAttendeeRsvp();
  const { success, error } = useNotistack();

  const resolvedStatus = status ?? null;
  const canRespond =
    Boolean(meetCode) &&
    Boolean(attendeeId) &&
    resolvedStatus === AttendeeStatusEnum.Invited;

  const handleConfirm = async () => {
    if (!meetCode || !attendeeId) return;

    try {
      const response = await confirmAttendeeAsync({
        meetCode,
        attendeeId,
      });
      navigate(
        response.hasMissingFields
          ? `/meets/${meetCode}/${attendeeId}?action=edit`
          : `/meets/${meetCode}/${attendeeId}`,
      );
      success("Attendance confirmed");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to update attendance";
      error(message);
    }
  };

  const handleDecline = async () => {
    if (!meetCode || !attendeeId) return;

    try {
      await declineAttendeeAsync({
        meetCode,
        attendeeId,
      });
      success("Attendance declined");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to update attendance";
      error(message);
    }
  };

  if (!canRespond) {
    return null;
  }

  return (
    <Alert
      severity="info"
      variant="outlined"
      icon={false}
      sx={{
        borderRadius: 2,
        py: 2.5,
        px: 3,
        "& .MuiAlert-message": { width: "100%" },
      }}
    >
      <Stack spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
        <Stack spacing={0.5} alignItems={{ xs: "flex-start", sm: "center" }}>
          <Typography variant="h5" fontWeight={700}>
            Please confirm your attendance
          </Typography>
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            variant="contained"
            color="success"
            disabled={isLoading}
            onClick={() => void handleConfirm()}
          >
            {isLoading ? "Saving..." : "Confirm"}
          </Button>
          <Button
            variant="outlined"
            color="error"
            disabled={isLoading}
            onClick={() => void handleDecline()}
          >
            {isLoading ? "Saving..." : "Decline"}
          </Button>
        </Stack>
      </Stack>
    </Alert>
  );
}
