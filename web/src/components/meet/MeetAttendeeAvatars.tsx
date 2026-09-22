import { Avatar, AvatarGroup, Stack, Tooltip, Typography } from "@mui/material";
import { MeetAttendeePreview } from "../../types/MeetModel";

type MeetAttendeeAvatarsProps = {
  attendees: MeetAttendeePreview[];
};

const MAX_VISIBLE_ATTENDEES = 9;

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function MeetAttendeeAvatars({ attendees }: MeetAttendeeAvatarsProps) {
  if (!attendees.length) {
    return null;
  }

  const visibleAttendees = attendees.slice(0, MAX_VISIBLE_ATTENDEES);
  const remainingCount = Math.max(
    0,
    attendees.length - visibleAttendees.length,
  );

  return (
    <Stack direction="row" spacing={0.25} alignItems="center">
      <AvatarGroup
        max={visibleAttendees.length}
        sx={{
          "& .MuiAvatar-root": {
            width: 22,
            height: 22,
            fontSize: 10,
            borderWidth: 2,
          },
        }}
      >
        {visibleAttendees.map((attendee) => (
          <Tooltip key={attendee.id} title={attendee.name}>
            <Avatar src={attendee.avatarUrl || undefined}>
              {getInitials(attendee.name)}
            </Avatar>
          </Tooltip>
        ))}
      </AvatarGroup>
      {remainingCount > 0 ? (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ whiteSpace: "nowrap", pt: "2px" }}
        >
          ...{remainingCount} more
        </Typography>
      ) : null}
    </Stack>
  );
}
