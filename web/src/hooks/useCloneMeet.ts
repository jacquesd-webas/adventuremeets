import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";
import type Meet from "../types/MeetModel";

type CloneMeetPayload = {
  meetId: string;
  name?: string;
};

export function useCloneMeet() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<Meet, Error, CloneMeetPayload>({
    mutationFn: async ({ meetId, name }) => {
      return api.post<Meet>(`/meets/${meetId}/clone`, {
        name,
      });
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["meets"] });
      queryClient.invalidateQueries({ queryKey: ["meet", variables.meetId] });
      if (result?.id) {
        queryClient.invalidateQueries({ queryKey: ["meet", result.id] });
      }
    },
  });

  return {
    cloneMeet: mutation.mutate,
    cloneMeetAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
