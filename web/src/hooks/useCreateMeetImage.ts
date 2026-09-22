import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";
import MeetImage from "../types/MeetImageModel";
import { meetImageQueryKeys } from "./meetImageQueryKeys";

type CreateMeetImagePayload = {
  meetId: string;
  file: File;
  isPrimary?: boolean;
};

export function useCreateMeetImage() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    { image: MeetImage },
    Error,
    CreateMeetImagePayload
  >({
    mutationFn: async ({ meetId, file, isPrimary }) => {
      const body = new FormData();
      body.append("file", file);
      if (isPrimary !== undefined) {
        body.append("isPrimary", String(isPrimary));
      }
      return api.postForm<{ image: MeetImage }>(
        `/meets/${meetId}/images`,
        body,
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
    createMeetImage: mutation.mutate,
    createMeetImageAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
