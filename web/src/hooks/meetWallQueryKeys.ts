export const meetWallQueryKeys = {
  all: ["meet-wall"] as const,
  byMeet: (
    meetId?: string | null,
    attendeeId?: string | null,
    sessionVersion?: number | null,
  ) =>
    [
      ...meetWallQueryKeys.all,
      meetId,
      attendeeId ?? null,
      sessionVersion ?? null,
    ] as const,
};

export default meetWallQueryKeys;
