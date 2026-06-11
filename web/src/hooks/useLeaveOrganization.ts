import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";

type LeaveOrganizationPayload = {
  id: string;
};

export function useLeaveOrganization() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, LeaveOrganizationPayload>({
    mutationFn: async ({ id }) => {
      await api.post(`/organizations/${id}/leave`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organisations"] });
    },
  });

  return {
    leaveOrganization: mutation.mutate,
    leaveOrganizationAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}
