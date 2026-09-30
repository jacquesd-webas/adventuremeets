import { Box, Stack, Typography } from "@mui/material";
import type { Attendee } from "../../types/AttendeeModel";
import { shortTimestamp } from "../../helpers/formatFriendlyTimestamp";

type AttendeeIndemnityFingerprintDetailsProps = {
  indemnityAcceptance?: Attendee["indemnityAcceptance"];
  needIndemnityConfirmationEmail?: boolean;
};

export function AttendeeIndemnityFingerprintDetails({
  indemnityAcceptance,
  needIndemnityConfirmationEmail = false,
}: AttendeeIndemnityFingerprintDetailsProps) {
  return (
    <Stack
      spacing={0.75}
      sx={{
        p: 2,
        width: "100%",
        maxWidth: 420,
        mx: "auto",
        boxSizing: "border-box",
      }}
    >
      <Typography variant="subtitle2">Acceptance fingerprint</Typography>
      <Typography variant="body2">
        Accepted: {shortTimestamp(indemnityAcceptance?.acceptedAt) || "Unknown"}
      </Typography>
      {indemnityAcceptance?.acceptedByName ? (
        <Typography variant="body2">
          By: {indemnityAcceptance.acceptedByName}
        </Typography>
      ) : null}
      {indemnityAcceptance?.acceptedByEmail ? (
        <Typography variant="body2">
          Email: {indemnityAcceptance.acceptedByEmail}
        </Typography>
      ) : null}
      {indemnityAcceptance?.acceptedByPhone ? (
        <Typography variant="body2">
          Phone: {indemnityAcceptance.acceptedByPhone}
        </Typography>
      ) : null}
      {indemnityAcceptance?.acceptanceIp ? (
        <Typography variant="body2">
          IP: {indemnityAcceptance.acceptanceIp}
        </Typography>
      ) : null}
      {indemnityAcceptance?.acceptanceUserAgent ? (
        <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
          Device: {indemnityAcceptance.acceptanceUserAgent}
        </Typography>
      ) : null}
      {indemnityAcceptance?.indemnityTextHash ? (
        <Typography variant="caption" sx={{ overflowWrap: "anywhere" }}>
          Fingerprint: {indemnityAcceptance.indemnityTextHash}
        </Typography>
      ) : null}
      {indemnityAcceptance?.locale || indemnityAcceptance?.timeZone ? (
        <Typography variant="caption" color="text.secondary">
          {[indemnityAcceptance.locale, indemnityAcceptance.timeZone]
            .filter(Boolean)
            .join(" · ")}
        </Typography>
      ) : null}
      {needIndemnityConfirmationEmail ? (
        <Box sx={{ borderTop: 1, borderColor: "divider", pt: 0.75 }}>
          <Typography variant="body2">
            Confirmed
            {indemnityAcceptance?.confirmationMethod === "email"
              ? " by email"
              : indemnityAcceptance?.confirmationMethod === "sign-in"
                ? " by sign-in"
                : ""}
            : {shortTimestamp(indemnityAcceptance?.confirmedAt) || "Unknown"}
            {indemnityAcceptance?.confirmationMethod === "email" &&
            indemnityAcceptance.acceptedByEmail
              ? ` (${indemnityAcceptance.acceptedByEmail})`
              : ""}
          </Typography>
        </Box>
      ) : null}
    </Stack>
  );
}
