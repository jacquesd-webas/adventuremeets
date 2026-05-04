import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { AttendeeHistoryItem } from "../types/AttendeeHistoryItemModel";

type AttendeeHistoryResponse =
  | { history: AttendeeHistoryItem[] }
  | AttendeeHistoryItem[];

export function useFetchAttendeeHistory(
  attendeeId?: string | null,
  meetId?: string | null
) {
  const api = useApi();
  const query = useQuery({
    queryKey: ["attendee-history", meetId, attendeeId],
    enabled: Boolean(meetId && attendeeId),
    queryFn: async () => {
      const res = await api.get<AttendeeHistoryResponse>(
        `/meets/${meetId}/attendees/${attendeeId}/history`
      );
      if (Array.isArray(res)) return res;
      return (res as any).history ?? [];
    },
  });

  return {
    data: (query.data || []) as AttendeeHistoryItem[],
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
  };
}
