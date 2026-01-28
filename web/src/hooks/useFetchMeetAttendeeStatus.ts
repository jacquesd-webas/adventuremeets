import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";
import AttendeeStatusEnum from "../types/AttendeeStatusEnum";
import { Meet } from "../types/MeetModel";

type MeetAttendeeResponse = {
  attendee: {
    id: string;
    userId?: string | null;
    status: AttendeeStatusEnum | null;
    email?: string | null;
    phone?: string | null;
    name?: string | null;
  };
};

export function useFetchMeetAttendeeStatus(
  meetCode?: string | null,
  attendeeId?: string | null
) {
  const api = useApi();
  const query = useQuery({
    queryKey: ["attendee-status", meetCode, attendeeId],
    enabled: Boolean(meetCode) && Boolean(attendeeId),
    queryFn: async () => {
      if (!meetCode) return null;
      return api.get<MeetAttendeeResponse>(
        `/meets/${meetCode}/attendeeStatus/${attendeeId}`
      );
    },
  });

  return {
    data: query.data ?? null,
    status: query.data?.attendee?.status ?? null,
    attendee: query.data?.attendee ?? null,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}
