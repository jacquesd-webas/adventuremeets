export const attendeeMessageQueryKeys = {
  meet: (meetId?: string | null) => ["attendee-messages", meetId] as const,
  attendee: (meetId?: string | null, attendeeId?: string | null) =>
    ["attendee-messages", meetId, attendeeId] as const,
};
