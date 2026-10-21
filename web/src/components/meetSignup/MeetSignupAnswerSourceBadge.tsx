import { Chip, Tooltip } from "@mui/material";

export type SignupAnswerSource = "profile" | "previous-meet";

const sourceDetails: Record<
  SignupAnswerSource,
  { label: string; tooltip: string }
> = {
  profile: {
    label: "From profile",
    tooltip: "This value was auto-populated from your profile.",
  },
  "previous-meet": {
    label: "From prev meet",
    tooltip: "This value was populated from a previous meet.",
  },
};

export function MeetSignupAnswerSourceBadge({
  source,
}: {
  source: SignupAnswerSource;
}) {
  const { label, tooltip } = sourceDetails[source];

  return (
    <Tooltip title={tooltip}>
      <Chip size="small" label={label} aria-label={`${label}: ${tooltip}`} />
    </Tooltip>
  );
}
