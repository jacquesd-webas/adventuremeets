import { useMutation } from "@tanstack/react-query";
import { useApi } from "./useApi";

export type AddAttendeePayload = {
  meetId: string;
  name: string;
  email: string;
  phone: string;
  guestOf?: string;
  isMinor?: boolean;
  GuardianName?: string;
  guests?: number;
  guestsList?: { name: string; isMinor: boolean }[];
  indemnityAccepted?: boolean;
  indemnityMinors?: string;
  metaValues?: { definitionId: string; value: string }[];
  captchaToken?: string;
};

type AddAttendeeResponse = {
  attendee: {
    id: string;
  };
};

export function useAddAttendee() {
  const api = useApi();

  const mutation = useMutation<AddAttendeeResponse, Error, AddAttendeePayload>({
    mutationFn: async ({ meetId, ...payload }) => {
      return api.post<AddAttendeeResponse>(`/meets/${meetId}/attendees`, payload);
    }
  });

  return {
    addAttendee: mutation.mutate,
    addAttendeeAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error
  };
}
