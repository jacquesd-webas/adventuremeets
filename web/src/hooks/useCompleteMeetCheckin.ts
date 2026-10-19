import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";

export function useCompleteMeetCheckin() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (meetId: string) =>
      api.patch(`/meets/${meetId}/checkin-complete`, {}),
    onSuccess: (_result, meetId) => {
      queryClient.invalidateQueries({ queryKey: ["meets"] });
      queryClient.invalidateQueries({ queryKey: ["meet", meetId] });
      queryClient.invalidateQueries({ queryKey: ["attendee-history"] });
    },
  });
}
