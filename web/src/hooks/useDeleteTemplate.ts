import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";

type DeleteTemplatePayload = {
  organizationId: string;
  templateId: string;
};

export function useDeleteTemplate() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<unknown, Error, DeleteTemplatePayload>({
    mutationFn: async ({ organizationId, templateId }) => {
      return api.del(`/organizations/${organizationId}/templates/${templateId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["organization-templates", variables.organizationId],
      });
    },
  });

  return {
    deleteTemplate: mutation.mutate,
    deleteTemplateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}
