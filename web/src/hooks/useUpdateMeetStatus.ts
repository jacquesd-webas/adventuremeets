import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";

type UpdateMeetStatusPayload = {
  meetId: string;
  statusId: number;
};

export function useUpdateMeetStatus() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<unknown, Error, UpdateMeetStatusPayload>({
    mutationFn: async ({ meetId, statusId }) => {
      return api.patch(`/meets/${meetId}/status`, { statusId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meets"] });
    }
  });

  return {
    updateStatus: mutation.mutate,
    updateStatusAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error
  };
}
