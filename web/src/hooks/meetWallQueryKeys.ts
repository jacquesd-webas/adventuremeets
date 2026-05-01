export const meetWallQueryKeys = {
  all: ["meet-wall"] as const,
  byMeet: (meetId?: string | null, attendeeId?: string | null) =>
    [...meetWallQueryKeys.all, meetId, attendeeId ?? null] as const,
};

export default meetWallQueryKeys;
