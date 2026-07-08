import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { WallItem } from "../types/WallItemModel";
import { meetWallQueryKeys } from "./meetWallQueryKeys";

type CreateWallItemPayload = {
  meetId: string;
  attendeeId?: string;
  comment?: string;
  stars?: number;
  file?: File;
};

export function useCreateWallItem() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    { wallItem: WallItem },
    Error,
    CreateWallItemPayload
  >({
    mutationFn: async ({
      meetId,
      attendeeId,
      comment,
      stars,
      file,
    }) => {
      if (file) {
        const body = new FormData();
        body.append("file", file);
        if (attendeeId) {
          body.append("attendeeId", attendeeId);
        }
        if (comment) {
          body.append("comment", comment);
        }
        if (stars !== undefined) {
          body.append("stars", String(stars));
        }
        return api.postForm<{ wallItem: WallItem }>(`/meets/${meetId}/wall`, body);
      }

      return api.post<{ wallItem: WallItem }>(`/meets/${meetId}/wall`, {
        attendeeId,
        comment,
        stars,
      });
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...meetWallQueryKeys.all, variables.meetId],
      });
    },
  });

  return {
    createWallItem: mutation.mutate,
    createWallItemAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

export default useCreateWallItem;
