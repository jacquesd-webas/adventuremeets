import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { Organization } from "./useOrganization";

type UpdatePayload = {
  id: string;
  name: string;
};

export function useUpdateOrganization() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<Organization, Error, UpdatePayload>({
    mutationFn: async (payload) => {
      const res = await api.patch<{ organization: Organization }>(`/organizations/${payload.id}`, { name: payload.name });
      return res.organization;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["organization", data.id], data);
    }
  });

  return {
    updateOrganization: mutation.mutate,
    updateOrganizationAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null
  };
}
