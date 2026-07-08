import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";

type UpdateMeetStatusPayload = {
  meetId: string;
  statusId: number;
  notifyAttendees?: boolean;
  reconfirmAttendees?: boolean;
};

export function useUpdateMeetStatus() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<unknown, Error, UpdateMeetStatusPayload>({
    mutationFn: async ({
      meetId,
      statusId,
      notifyAttendees,
      reconfirmAttendees,
    }) => {
      return api.patch(`/meets/${meetId}/status`, {
        statusId,
        notifyAttendees,
        reconfirmAttendees,
      });
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["meets"] });
      queryClient.invalidateQueries({ queryKey: ["meet", variables.meetId] });
    },
  });

  return {
    updateStatus: mutation.mutate,
    updateStatusAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
