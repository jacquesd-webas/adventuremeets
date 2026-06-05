import { Avatar, AvatarGroup, Tooltip } from "@mui/material";
import { MeetAttendeePreview } from "../../types/MeetModel";

type MeetAttendeeAvatarsProps = {
  attendees: MeetAttendeePreview[];
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function MeetAttendeeAvatars({
  attendees,
}: MeetAttendeeAvatarsProps) {
  if (!attendees.length) {
    return null;
  }

  return (
    <AvatarGroup
      max={8}
      sx={{
        "& .MuiAvatar-root": {
          width: 22,
          height: 22,
          fontSize: 10,
          borderWidth: 2,
        },
      }}
    >
      {attendees.map((attendee) => (
        <Tooltip key={attendee.id} title={attendee.name}>
          <Avatar src={attendee.avatarUrl || undefined}>
            {getInitials(attendee.name)}
          </Avatar>
        </Tooltip>
      ))}
    </AvatarGroup>
  );
}
