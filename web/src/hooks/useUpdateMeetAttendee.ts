import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";

type UpdateMeetAttendeePayload = {
  meetId: string;
  attendeeId: string;
  status?: string;
  paidFullAt?: string | null;
  paidDepositAt?: string | null;
};

export function useUpdateMeetAttendee() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<unknown, Error, UpdateMeetAttendeePayload>({
    mutationFn: async ({
      meetId,
      attendeeId,
      status,
      paidFullAt,
      paidDepositAt,
    }) => {
      const payload = { status, paidFullAt, paidDepositAt };
      Object.keys(payload).forEach(
        (key) => payload[key] === undefined && delete payload[key]
      );
      return api.patch(`/meets/${meetId}/attendees/${attendeeId}`, payload);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["meet-attendees", variables.meetId],
      });
    },
  });

  return {
    updateMeetAttendee: mutation.mutate,
    updateMeetAttendeeAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}
