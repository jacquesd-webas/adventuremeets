import { useMutation } from "@tanstack/react-query";
import { useApi } from "./useApi";

type CheckAttendeePayload = {
  meetId: string;
  email?: string;
  phone?: string;
};

type CheckAttendeeResponse = {
  attendee: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    guests?: number;
  } | null;
};

export function useCheckMeetAttendee() {
  const api = useApi();

  const mutation = useMutation<CheckAttendeeResponse, Error, CheckAttendeePayload>({
    mutationFn: async ({ meetId, email, phone }) => {
      const params = new URLSearchParams();
      if (email) params.set("email", email);
      if (phone) params.set("phone", phone);
      return api.get<CheckAttendeeResponse>(`/meets/${meetId}/attendees/check?${params.toString()}`);
    }
  });

  return {
    checkAttendee: mutation.mutate,
    checkAttendeeAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error
  };
}
