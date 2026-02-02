import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";

export type AttendeeMessage = {
  id: string;
  timestamp?: string;
  from?: string;
  to?: string;
  isRead?: boolean;
  content?: string;
};

type MessagesResponse = { messages: AttendeeMessage[] } | AttendeeMessage[];

export function useFetchAttendeeMessages(
  meetId?: string | null,
  attendeeId?: string | null
) {
  const api = useApi();
  const query = useQuery({
    queryKey: ["attendee-messages", meetId, attendeeId],
    enabled: Boolean(meetId && attendeeId),
    queryFn: async () => {
      const res = await api.get<MessagesResponse>(
        `/meets/${meetId}/attendees/${attendeeId}/messages`
      );
      if (Array.isArray(res)) return res;
      return (res as any).messages ?? [];
    },
  });

  return {
    data: (query.data || []) as AttendeeMessage[],
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
  };
}
