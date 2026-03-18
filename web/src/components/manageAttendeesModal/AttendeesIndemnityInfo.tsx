import { Box, Button, ButtonGroup, Stack, Typography } from "@mui/material";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import DisabledByDefaultIcon from "@mui/icons-material/DisabledByDefault";

type AttendeesIndemnityInfoProps = {
  hasIndemnity?: boolean;
  indemnityAccepted: boolean;
  guests?: number | null;
  guestOfLabel?: string | null;
  inviteDisabled: boolean;
  showDivider?: boolean;
  guestsUpdating?: boolean;
  onGuestIncrement: () => void;
  onGuestDecrement: () => void;
  onInvite: () => void;
};

export function AttendeesIndemnityInfo({
  hasIndemnity = false,
  indemnityAccepted,
  guests,
  guestOfLabel = null,
  inviteDisabled,
  showDivider = true,
  guestsUpdating = false,
  onGuestIncrement,
  onGuestDecrement,
  onInvite,
}: AttendeesIndemnityInfoProps) {
  const safeGuests = guests ?? 0;
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
            {indemnityAccepted ? (
              <CheckBoxIcon sx={{ color: "success.main", fontSize: 18 }} />
            ) : (
              <DisabledByDefaultIcon
                sx={{ color: "error.main", fontSize: 18 }}
              />
            )}
            <Typography variant="body2">
              {indemnityAccepted ? "Accepted" : "Not Accepted"}
            </Typography>
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
            <ButtonGroup
              size="small"
              variant="outlined"
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
                disabled={guestsUpdating || safeGuests <= 0}
              >
                -
              </Button>
              <Button onClick={onGuestIncrement} disabled={guestsUpdating}>
                +
              </Button>
            </ButtonGroup>
            <Button
              size="small"
              variant="text"
              onClick={onInvite}
              disabled={inviteDisabled}
              sx={{ minWidth: "auto", px: 0.75 }}
            >
              Invite link
            </Button>
          </Stack>
        )}
      </Box>
    </>
  );
}
