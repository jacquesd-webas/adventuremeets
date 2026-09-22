import {
  Box,
  Button,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AttendeeStatusEnum from "../../types/AttendeeStatusEnum";
import Meet from "../../types/MeetModel";
import { AttendeeStatusAlert } from "./AttendeeStatusAlert";
import { AttendeeRsvp } from "./AttendeeRsvp";
import { ContactOrganizerDialog } from "./ContactOrganizerDialog";
import { VerifyAttendeeEmailDialog } from "./VerifyAttendeeEmailDialog";
import { WithdrawApplicationDialog } from "./WithdrawApplicationDialog";
import { getMeetResponseWording } from "../../helpers/meetResponseWording";

type AttendeeStatusActionsProps = {
  meet: Meet;
  meetCode?: string;
  attendeeId?: string;
  attendeeStatus?: AttendeeStatusEnum | null;
};

export function AttendeeStatusActions({
  meet,
  meetCode,
  attendeeId,
  attendeeStatus,
}: AttendeeStatusActionsProps) {
  const wording = getMeetResponseWording(Boolean(meet.autoPlacement));
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);

  return (
    <>
      {attendeeStatus === AttendeeStatusEnum.Invited ? (
        <AttendeeRsvp
          meetCode={meetCode}
          attendeeId={attendeeId}
          status={attendeeStatus}
        />
      ) : (
        <>
          <AttendeeStatusAlert status={attendeeStatus} />

          <Typography variant="body1">
            You may choose to make changes to your {wording.noun} using any of
            the links below:
          </Typography>

          <Box sx={{ width: "100%" }}>
            <Stack
              direction={isMobile ? "column" : "row"}
              spacing={2}
              alignItems="center"
              justifyContent="center"
              sx={isMobile ? { width: "100%" } : undefined}
            >
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  setIsVerifyOpen(true);
                }}
                fullWidth={isMobile}
              >
                {wording.editLabel}
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  setIsWithdrawOpen(true);
                }}
                fullWidth={isMobile}
              >
                {wording.withdrawLabel}
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  setIsContactOpen(true);
                }}
                fullWidth={isMobile}
              >
                Contact Organiser
              </Button>
            </Stack>
          </Box>
        </>
      )}

      <ContactOrganizerDialog
        open={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        isMobile={isMobile}
        meet={meet}
      />

      <WithdrawApplicationDialog
        open={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        meetId={meet.id}
        attendeeId={attendeeId}
        attendeeStatus={attendeeStatus}
        isRsvpMode={Boolean(meet.autoPlacement)}
      />

      <VerifyAttendeeEmailDialog
        open={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        meetId={meet.id}
        attendeeId={attendeeId}
        isRsvpMode={Boolean(meet.autoPlacement)}
        onVerified={() => {
          if (!meetCode || !attendeeId) return;
          navigate(`/meets/${meetCode}/${attendeeId}?action=edit`);
        }}
      />
    </>
  );
}

export default AttendeeStatusActions;
