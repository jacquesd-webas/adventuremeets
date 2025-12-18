import { useMutation } from "@tanstack/react-query";
import { useApi } from "./useApi";

export type AddAttendeePayload = {
  meetId: string;
  name: string;
  email: string;
  phone: string;
  guests?: number;
  indemnityAccepted?: boolean;
  indemnityMinors?: string;
  metaValues?: { definitionId: string; value: string }[];
};

export function useAddAttendee() {
  const api = useApi();

  const mutation = useMutation<unknown, Error, AddAttendeePayload>({
    mutationFn: async ({ meetId, ...payload }) => {
      return api.post(`/meets/${meetId}/attendees`, payload);
    }
  });

  return {
    addAttendee: mutation.mutate,
    addAttendeeAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error
  };
}
