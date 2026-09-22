import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { WallItem } from "../types/WallItemModel";
import { meetWallQueryKeys } from "./meetWallQueryKeys";

type UpdateWallItemCommentPayload = {
  meetId: string;
  wallItemId: string;
  comment: string;
  attendeeId?: string;
};

export function useUpdateWallItemComment() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    { wallItem: WallItem },
    Error,
    UpdateWallItemCommentPayload
  >({
    mutationFn: async ({ meetId, wallItemId, comment, attendeeId }) => {
      return api.patch<{ wallItem: WallItem }>(`/meets/${meetId}/wall/${wallItemId}`, {
        comment,
        attendeeId,
      });
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...meetWallQueryKeys.all, variables.meetId],
      });
    },
  });

  return {
    updateWallItemComment: mutation.mutate,
    updateWallItemCommentAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

export default useUpdateWallItemComment;
