import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";

type UpdateMeetAttendeeByCodePayload = {
  meetCode: string;
  attendeeId: string;
  status: string;
};

export function useUpdateMeetAttendeeByCode() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<unknown, Error, UpdateMeetAttendeeByCodePayload>(
    {
      mutationFn: async ({ meetCode, attendeeId, status }) => {
        return api.patch(`/meets/${meetCode}/attendee/${attendeeId}`, {
          status,
        });
      },
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries({
          queryKey: ["attendee-status", variables.attendeeId],
        });
        queryClient.invalidateQueries({
          queryKey: ["attendee-edit", variables.meetCode, variables.attendeeId],
        });
      },
    },
  );

  return {
    updateMeetAttendeeByCode: mutation.mutate,
    updateMeetAttendeeByCodeAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}
