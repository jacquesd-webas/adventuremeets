import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { Organization } from "../types/OrganizationModel";

type UploadOrganizationLogoPayload = {
  file: File;
};

export function useUploadOrganizationLogo(organizationId?: string | null) {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    { organization: Organization },
    Error,
    UploadOrganizationLogoPayload
  >({
    mutationFn: async ({ file }) => {
      const body = new FormData();
      body.append("file", file);
      return api.postForm<{ organization: Organization }>(
        `/organizations/${organizationId}/logo`,
        body,
      );
    },
    onSuccess: (result) => {
      queryClient.setQueryData(
        ["organization", result.organization.id],
        result.organization,
      );
      queryClient.invalidateQueries({
        queryKey: ["organization", result.organization.id],
      });
    },
  });

  return {
    uploadOrganizationLogoAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}
