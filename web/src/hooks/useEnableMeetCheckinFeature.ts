import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";

type CheckinFeature = "walkins" | "self-checkin";

export function useEnableMeetCheckinFeature(meetId?: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (feature: CheckinFeature) => {
      if (!meetId) throw new Error("Meet is unavailable");
      const updates =
        feature === "walkins"
          ? { allowSelfCheckin: true, allowWalkins: true }
          : { allowSelfCheckin: true };
      return api.patch(`/meets/${meetId}`, updates);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["meet", meetId] }),
        queryClient.invalidateQueries({ queryKey: ["meets"] }),
      ]);
    },
  });
}
