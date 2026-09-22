import { useMutation } from "@tanstack/react-query";
import { useApi } from "./useApi";

type CheckAttendeePayload = {
  meetId: string;
  name?: string;
  email?: string;
  phone?: string;
};

type MatchedAttendee = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  guests?: number;
  status?: string;
};

type CheckAttendeeResponse = {
  attendee: MatchedAttendee | null;
  attendees?: MatchedAttendee[];
};

export function useCheckMeetAttendee() {
  const api = useApi();

  const mutation = useMutation<
    CheckAttendeeResponse,
    Error,
    CheckAttendeePayload
  >({
    mutationFn: async ({ meetId, name, email, phone }) => {
      const params = new URLSearchParams();
      if (name) params.set("name", name);
      if (email) params.set("email", email);
      if (phone) params.set("phone", phone);
      return api.get<CheckAttendeeResponse>(
        `/meets/${meetId}/attendees/check?${params.toString()}`,
      );
    },
  });

  return {
    checkAttendee: mutation.mutate,
    checkAttendeeAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
