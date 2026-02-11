import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";

type MeetAttendeeEditResponse = {
  attendee: {
    id: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    guests?: number | null;
    indemnityAccepted?: boolean | null;
    metaValues?: Array<{ fieldKey: string; value: string }>;
  };
};

export function useFetchMeetAttendeeEdit(
  meetCode?: string | null,
  attendeeId?: string | null,
) {
  const api = useApi();
  const query = useQuery({
    queryKey: ["attendee-edit", meetCode, attendeeId],
    enabled: Boolean(meetCode) && Boolean(attendeeId),
    queryFn: async () => {
      if (!meetCode || !attendeeId) return null;
      return api.get<MeetAttendeeEditResponse>(
        `/meets/${meetCode}/attendee/${attendeeId}`,
      );
    },
  });

  return {
    data: query.data ?? null,
    attendee: query.data?.attendee ?? null,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}
