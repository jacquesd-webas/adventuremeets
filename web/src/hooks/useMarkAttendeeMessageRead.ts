import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";

type MarkMessageReadPayload = {
  meetId: string;
  messageId: string;
  attendeeId?: string | null;
};

export function useMarkAttendeeMessageRead() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<unknown, Error, MarkMessageReadPayload>({
    mutationFn: async ({ meetId, messageId }) => {
      return api.patch(`/meets/${meetId}/messages/${messageId}/read`, {});
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["attendee-messages", variables.meetId, variables.attendeeId],
      });
    },
  });

  return {
    markRead: mutation.mutate,
    markReadAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}
