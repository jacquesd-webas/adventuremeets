import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { Organization } from "../types/OrganizationModel";

type CreateOrganizationPayload = {
  name: string;
};

export function useCreateOrganization() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<Organization, Error, CreateOrganizationPayload>({
    mutationFn: async (payload) => {
      const res = await api.post<{ organization: Organization }>(
        "/organizations",
        {
          name: payload.name,
        },
      );
      return res.organization;
    },
    onSuccess: (organization) => {
      queryClient.setQueryData(["organization", organization.id], organization);
      queryClient.invalidateQueries({ queryKey: ["organisations"] });
    },
  });

  return {
    createOrganization: mutation.mutate,
    createOrganizationAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}
