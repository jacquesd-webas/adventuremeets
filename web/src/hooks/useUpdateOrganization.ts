import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { Organization } from "../types/OrganizationModel";

type UpdatePayload = {
  id: string;
  name: string;
  theme?: string;
  isPrivate?: boolean;
  canViewAllMeets?: boolean;
};

export function useUpdateOrganization(organizationId?: string | null) {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<Organization, Error, UpdatePayload>({
    mutationFn: async (payload) => {
      const res = await api.patch<{ organization: Organization }>(
        `/organizations/${organizationId}`,
        {
          name: payload.name,
          theme: payload.theme,
          isPrivate: payload.isPrivate,
          canViewAllMeets: payload.canViewAllMeets,
        }
      );
      return res?.organization;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["organization", data.id], data);
    },
  });

  return {
    updateOrganization: mutation.mutate,
    updateOrganizationAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}
