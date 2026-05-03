import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { UserIceInfo } from "../types/UserIceInfoModel";

export function useUpdateMyIceInfo() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<any, Error, UserIceInfo>({
    mutationFn: async (payload) => {
      const res = await api.patch<{ iceInfo: UserIceInfo | null }>(
        "/users/me/ice",
        payload,
      );
      return res.iceInfo;
    },
    onSuccess: (iceInfo) => {
      queryClient.setQueryData(["users", "me", "ice"], iceInfo ?? null);
      queryClient.invalidateQueries({ queryKey: ["users", "me", "ice"] });
    },
  });

  return {
    updateMyIceInfoAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}
