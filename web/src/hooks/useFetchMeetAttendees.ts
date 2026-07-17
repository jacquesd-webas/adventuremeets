import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";
import type { Attendee } from "../types/AttendeeModel";
import {
  getCachedMeetAttendees,
  setCachedMeetAttendees,
  type CachedAttendeeFilter,
} from "../helpers/checkinOfflineStore";

type AttendeeFilter = "all" | "accepted";
const EMPTY_ATTENDEES: Attendee[] = [];

export function useFetchMeetAttendees(
  meetId?: string | null,
  filter: AttendeeFilter | null = "all",
) {
  const api = useApi();
  const resolvedFilter = (filter || "all") as CachedAttendeeFilter;
  const query = useQuery({
    queryKey: ["meet-attendees", meetId, filter],
    enabled: Boolean(meetId) && Boolean(filter),
    initialData: () => {
      if (!meetId || !filter) return undefined;
      const cachedAttendees = getCachedMeetAttendees(meetId, resolvedFilter);
      if (!cachedAttendees.length) return undefined;
      return { attendees: cachedAttendees, source: "cache" as const };
    },
    queryFn: async () => {
      if (!meetId) return { attendees: [] };
      const params = filter === "accepted" ? "?filter=accepted" : "";
      try {
        const response = await api.get<{ attendees: Attendee[] }>(
          `/meets/${meetId}/attendees${params}`,
        );
        setCachedMeetAttendees(meetId, resolvedFilter, response.attendees);
        return { attendees: response.attendees, source: "network" as const };
      } catch (error) {
        const cachedAttendees = getCachedMeetAttendees(meetId, resolvedFilter);
        if (cachedAttendees.length) {
          return { attendees: cachedAttendees, source: "cache" as const };
        }
        throw error;
      }
    },
  });

  return {
    data: query.data?.attendees ?? EMPTY_ATTENDEES,
    isLoading: query.isLoading,
    isOfflineData: query.data?.source === "cache",
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}
