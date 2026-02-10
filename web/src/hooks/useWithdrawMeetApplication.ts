import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { useNotistack } from "./useNotistack";

export function useWithdrawMeetApplication(meetId: string, attendeeId) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { error } = useNotistack();

  const mutation = useMutation<unknown, Error>({
    mutationFn: async () => {
      return api.patch(`/meets/${meetId}/attendeeStatus/${attendeeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendee-status", attendeeId],
      });
    },
    onError: (err) => {
      error(`Unable to withdraw application: ${err.message}`);
    },
  });

  return {
    withdrawMeetApplication: mutation.mutate,
    withdrawMeetApplicationAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}
