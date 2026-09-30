import {
  Box,
  Button,
  ButtonGroup,
  Drawer,
  Popover,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import DisabledByDefaultIcon from "@mui/icons-material/DisabledByDefault";
import { useState } from "react";
import { LockedTooltipWrapper } from "../LockedTooltipWrapper";
import type { Attendee } from "../../types/AttendeeModel";
import { useResendIndemnityConfirmation } from "../../hooks/useResendIndemnityConfirmation";
import { AttendeeIndemnityFingerprintDetails } from "./AttendeeIndemnityFingerprintDetails";

type AttendeesIndemnityInfoProps = {
  hasIndemnity?: boolean;
  indemnityAccepted: boolean;
  indemnityAcceptance?: Attendee["indemnityAcceptance"];
  needIndemnityConfirmationEmail?: boolean;
  meetId?: string | null;
  attendeeId: string;
  attendeeEmail?: string;
  guests?: number | null;
  guestOfLabel?: string | null;
  inviteDisabled: boolean;
  showDivider?: boolean;
  guestsUpdating?: boolean;
  onGuestIncrement: () => void;
  onGuestDecrement: () => void;
  onInvite: () => void;
  canManageMeet?: boolean;
};

export function AttendeesIndemnityInfo({
  hasIndemnity = false,
  indemnityAccepted,
  indemnityAcceptance,
  needIndemnityConfirmationEmail = false,
  meetId,
  attendeeId,
  attendeeEmail,
  guests,
  guestOfLabel = null,
  inviteDisabled,
  showDivider = true,
  guestsUpdating = false,
  onGuestIncrement,
  onGuestDecrement,
  onInvite,
  canManageMeet = true,
}: AttendeesIndemnityInfoProps) {
  const safeGuests = guests ?? 0;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"), {
    noSsr: true,
  });
  const [acceptanceAnchor, setAcceptanceAnchor] = useState<HTMLElement | null>(
    null,
  );
  const { resendIndemnityConfirmationAsync, isResendingIndemnity } =
    useResendIndemnityConfirmation();
  const canResendIndemnity = Boolean(
    canManageMeet &&
    meetId &&
    attendeeEmail &&
    needIndemnityConfirmationEmail &&
    indemnityAcceptance?.acceptedAt &&
    !indemnityAcceptance?.confirmedAt &&
    !indemnityAccepted,
  );

  const handleResendIndemnity = async () => {
    if (!meetId || !canResendIndemnity) return;
    try {
      await resendIndemnityConfirmationAsync({ meetId, attendeeId });
    } catch {
      // The mutation hook shows the error notification.
    }
  };

  return (
    <>
      {showDivider ? (
        <Box sx={{ borderTop: 1, borderColor: "divider", mt: 2, pt: 2 }} />
      ) : null}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "120px 1fr",
          rowGap: 0.75,
          columnGap: 2,
          alignItems: "center",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Indemnity:
        </Typography>
        {hasIndemnity ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            {indemnityAccepted ? null : (
              <DisabledByDefaultIcon
                sx={{ color: "error.main", fontSize: 18 }}
              />
            )}
            {indemnityAccepted ? (
              <Button
                size="small"
                variant="text"
                startIcon={
                  <CheckBoxIcon sx={{ color: "success.main", fontSize: 18 }} />
                }
                onClick={(event) => setAcceptanceAnchor(event.currentTarget)}
                sx={{ minWidth: "auto", px: 0.5, py: 0 }}
              >
                Accepted
              </Button>
            ) : (
              <Typography variant="body2">Not Accepted</Typography>
            )}
            {!indemnityAccepted && needIndemnityConfirmationEmail ? (
              <LockedTooltipWrapper isReadOnly={!canManageMeet}>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={!canResendIndemnity || isResendingIndemnity}
                  onClick={handleResendIndemnity}
                  sx={{ ml: 0.5, py: 0.25 }}
                >
                  {isResendingIndemnity ? "Sending…" : "Resend indemnity"}
                </Button>
              </LockedTooltipWrapper>
            ) : null}
            <Popover
              open={!isMobile && Boolean(acceptanceAnchor)}
              anchorEl={acceptanceAnchor}
              onClose={() => setAcceptanceAnchor(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            >
              <AttendeeIndemnityFingerprintDetails
                indemnityAcceptance={indemnityAcceptance}
                needIndemnityConfirmationEmail={needIndemnityConfirmationEmail}
              />
            </Popover>
            <Drawer
              anchor="bottom"
              open={isMobile && Boolean(acceptanceAnchor)}
              onClose={() => setAcceptanceAnchor(null)}
              ModalProps={{
                sx: { zIndex: theme.zIndex.modal + 1 },
              }}
              PaperProps={{
                sx: {
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                },
              }}
            >
              <AttendeeIndemnityFingerprintDetails
                indemnityAcceptance={indemnityAcceptance}
                needIndemnityConfirmationEmail={needIndemnityConfirmationEmail}
              />
            </Drawer>
          </Box>
        ) : (
          <Typography variant="body2">Not required</Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          Guests:
        </Typography>
        {guestOfLabel ? (
          <Typography variant="body2">Guest of {guestOfLabel}</Typography>
        ) : (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2">{safeGuests}</Typography>
            <LockedTooltipWrapper isReadOnly={!canManageMeet}>
              <ButtonGroup
                size="small"
                variant="outlined"
                disabled={!canManageMeet}
                sx={{
                  "& .MuiButton-root": {
                    minWidth: 24,
                    px: 0.5,
                    py: 0,
                    fontSize: 12,
                    lineHeight: 1.2,
                  },
                }}
              >
                <Button
                  onClick={onGuestDecrement}
                  disabled={!canManageMeet || guestsUpdating || safeGuests <= 0}
                >
                  -
                </Button>
                <Button
                  onClick={onGuestIncrement}
                  disabled={!canManageMeet || guestsUpdating}
                >
                  +
                </Button>
              </ButtonGroup>
            </LockedTooltipWrapper>
            <LockedTooltipWrapper isReadOnly={!canManageMeet}>
              <Button
                size="small"
                variant="text"
                onClick={onInvite}
                disabled={!canManageMeet || inviteDisabled}
                sx={{ minWidth: "auto", px: 0.75 }}
              >
                Invite link
              </Button>
            </LockedTooltipWrapper>
          </Stack>
        )}
      </Box>
    </>
  );
}
