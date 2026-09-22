import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { meetWallQueryKeys } from "./meetWallQueryKeys";
import { WallItem } from "../types/WallItemModel";

type UpdateWallItemReactionPayload = {
  meetId: string;
  wallItemId: string;
  reaction: "like" | "dislike" | "heart";
  attendeeId?: string;
};

export function useUpdateWallItemReaction() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    { wallItem: WallItem },
    Error,
    UpdateWallItemReactionPayload
  >({
    mutationFn: async ({ meetId, wallItemId, reaction, attendeeId }) => {
      return api.patch<{ wallItem: WallItem }>(
        `/meets/${meetId}/wall/${wallItemId}/reaction`,
        { reaction, attendeeId },
      );
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...meetWallQueryKeys.all, variables.meetId],
      });
    },
  });

  return {
    updateWallItemReaction: mutation.mutate,
    updateWallItemReactionAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

export default useUpdateWallItemReaction;
