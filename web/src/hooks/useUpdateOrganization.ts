import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { Organization } from "../types/OrganizationModel";

type UpdatePayload = {
  id: string;
  name: string;
};

export function useUpdateOrganization() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<Organization, Error, UpdatePayload>({
    mutationFn: async (payload) => {
      const res = await api.patch<{ organization: any }>(`/organizations/${payload.id}`, { name: payload.name });
      const org = res.organization;
      return {
        id: org.id,
        name: org.name,
        createdAt: org.createdAt ?? org.created_at,
        updatedAt: org.updatedAt ?? org.updated_at,
        userCount:
          typeof org.userCount === "number"
            ? org.userCount
            : org.user_count != null
            ? Number(org.user_count)
            : undefined,
      } as Organization;
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
