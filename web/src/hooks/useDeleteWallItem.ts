import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { meetWallQueryKeys } from "./meetWallQueryKeys";

type DeleteWallItemPayload = {
  meetId: string;
  wallItemId: string;
  attendeeId?: string;
};

export function useDeleteWallItem() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<{ deleted: boolean }, Error, DeleteWallItemPayload>({
    mutationFn: async ({ meetId, wallItemId, attendeeId }) => {
      const suffix = attendeeId
        ? `?attendeeId=${encodeURIComponent(attendeeId)}`
        : "";
      return api.del<{ deleted: boolean }>(`/meets/${meetId}/wall/${wallItemId}${suffix}`);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...meetWallQueryKeys.all, variables.meetId],
      });
    },
  });

  return {
    deleteWallItem: mutation.mutate,
    deleteWallItemAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

export default useDeleteWallItem;
