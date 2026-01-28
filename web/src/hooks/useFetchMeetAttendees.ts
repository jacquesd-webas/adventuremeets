import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";
import type { Attendee } from "../types/AttendeeModel";

type MeetAttendeesResponse = {
  attendees: Attendee[];
};

type AttendeeFilter = "all" | "accepted";

export function useFetchMeetAttendees(
  meetId?: string | null,
  filter: AttendeeFilter = "all"
) {
  const api = useApi();
  const query = useQuery({
    queryKey: ["meet-attendees", meetId, filter],
    enabled: Boolean(meetId),
    queryFn: async () => {
      if (!meetId) return { attendees: [] };
      const params = filter === "accepted" ? "?filter=accepted" : "";
      return api.get<MeetAttendeesResponse>(
        `/meets/${meetId}/attendees${params}`
      );
    },
  });

  return {
    data: query.data?.attendees ?? [],
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}
