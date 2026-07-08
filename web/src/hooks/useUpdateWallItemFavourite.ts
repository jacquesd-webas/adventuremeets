import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { WallItem } from "../types/WallItemModel";
import { meetWallQueryKeys } from "./meetWallQueryKeys";

type UpdateWallItemFavouritePayload = {
  meetId: string;
  wallItemId: string;
  favourite: number;
};

export function useUpdateWallItemFavourite() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    { wallItem: WallItem },
    Error,
    UpdateWallItemFavouritePayload
  >({
    mutationFn: async ({ meetId, wallItemId, favourite }) => {
      return api.patch<{ wallItem: WallItem }>(
        `/meets/${meetId}/wall/${wallItemId}/favourite`,
        { favourite },
      );
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...meetWallQueryKeys.all, variables.meetId],
      });
    },
  });

  return {
    updateWallItemFavourite: mutation.mutate,
    updateWallItemFavouriteAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

export default useUpdateWallItemFavourite;
