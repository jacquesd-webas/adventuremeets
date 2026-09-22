import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";

type DeleteMeetPayload = {
  meetId: string;
};

export function useDeleteMeet() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<unknown, Error, DeleteMeetPayload>({
    mutationFn: async ({ meetId }) => {
      return api.del(`/meets/${meetId}`);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["meets"] });
      queryClient.invalidateQueries({ queryKey: ["meet", variables.meetId] });
    },
  });

  return {
    deleteMeet: mutation.mutate,
    deleteMeetAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
