import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { Meet } from "../types/MeetModel";

export type AttendeeStatusResponse = {
  meet: Meet;
  attendee: {
    id: string;
    name?: string | null;
    status?: string | null;
    guests?: number | null;
    email?: string | null;
    phone?: string | null;
  };
};

export function useFetchMeetByAttendee(shareId?: string, attendeeId?: string) {
  const api = useApi();
  const query = useQuery({
    queryKey: ["attendee-status", attendeeId],
    enabled: Boolean(shareId && attendeeId),
    queryFn: async () => {
      if (!shareId || !attendeeId) return null;
      return api.get<AttendeeStatusResponse>(`/meets/${shareId}/${attendeeId}`);
    },
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}
