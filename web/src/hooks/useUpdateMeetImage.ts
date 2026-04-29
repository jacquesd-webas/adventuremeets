import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";
import MeetImage from "../types/MeetImageModel";
import { meetImageQueryKeys } from "./meetImageQueryKeys";

type UpdateMeetImagePayload = {
  meetId: string;
  imageId: string;
  isPrimary?: boolean;
};

export function useUpdateMeetImage() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    { image: MeetImage },
    Error,
    UpdateMeetImagePayload
  >({
    mutationFn: async ({ meetId, imageId, isPrimary }) => {
      return api.patch<{ image: MeetImage }>(
        `/meets/${meetId}/images/${imageId}`,
        {
          isPrimary,
        },
      );
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
    updateMeetImage: mutation.mutate,
    updateMeetImageAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
