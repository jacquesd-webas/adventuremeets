import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";

export type AttendeeMetaValue = {
  definitionId: string;
  label: string;
  fieldType?: string;
  required?: boolean;
  position?: number;
  value?: string | null;
};

export type MeetAttendee = {
  id: string;
  user_id?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  guests?: number | null;
  indemnity_accepted?: boolean | null;
  indemnity_minors?: string | null;
  status?: string | null;
  created_at?: string;
  metaValues?: AttendeeMetaValue[];
};

type MeetAttendeesResponse = {
  attendees: MeetAttendee[];
};

type AttendeeFilter = "all" | "accepted";

export function useFetchMeetAttendees(meetId?: string | null, enabled = true, filter: AttendeeFilter = "all") {
  const api = useApi();
  const query = useQuery({
    queryKey: ["meet-attendees", meetId, filter],
    enabled: Boolean(meetId) && enabled,
    queryFn: async () => {
      if (!meetId) return { attendees: [] };
      const params = filter === "accepted" ? "?filter=accepted" : "";
      return api.get<MeetAttendeesResponse>(`/meets/${meetId}/attendees${params}`);
    }
  });

  return {
    data: query.data?.attendees ?? [],
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch
  };
}
