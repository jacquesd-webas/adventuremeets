import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { meetImageQueryKeys } from "./meetImageQueryKeys";

type DeleteMeetImagePayload = {
  meetId: string;
  imageId: string;
};

export function useDeleteMeetImage() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    { removed: boolean },
    Error,
    DeleteMeetImagePayload
  >({
    mutationFn: async ({ meetId, imageId }) => {
      return api.del<{ removed: boolean }>(`/meets/${meetId}/images/${imageId}`);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: meetImageQueryKeys.list(variables.meetId),
      });
      queryClient.invalidateQueries({ queryKey: ["meet", variables.meetId] });
      queryClient.invalidateQueries({ queryKey: ["meets"] });
    },
  });

  return {
    deleteMeetImage: mutation.mutate,
    deleteMeetImageAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
