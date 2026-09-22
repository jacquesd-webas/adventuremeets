import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";

type AttendeeLookup = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  guests?: number;
};

type Response = {
  attendee: AttendeeLookup | null;
};

type Params = {
  meetId?: string | null;
  email?: string | null;
  phone?: string | null;
  enabled?: boolean;
};

export function useFetchMyMeetAttendee({
  meetId,
  email,
  phone,
  enabled = true,
}: Params) {
  const api = useApi();
  const trimmedEmail = email?.trim() || "";
  const trimmedPhone = phone?.trim() || "";

  const query = useQuery({
    queryKey: ["meet-attendee-check", meetId, trimmedEmail, trimmedPhone],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (trimmedEmail) params.set("email", trimmedEmail);
      if (trimmedPhone) params.set("phone", trimmedPhone);
      return api.get<Response>(
        `/meets/${meetId}/attendees/check?${params.toString()}`,
      );
    },
    enabled: Boolean(meetId) && Boolean(trimmedEmail || trimmedPhone) && enabled,
  });

  return {
    attendee: query.data?.attendee ?? null,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
  };
}
