import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { Template, TemplateMetaDefinition } from "../types/TemplateModel";

type UpdateTemplatePayload = {
  organizationId: string;
  templateId: string;
  name?: string;
  description?: string;
  approvedResponse?: string;
  rejectResponse?: string;
  waitlistResponse?: string;
  indemnity?: string;
  metaDefinitions?: TemplateMetaDefinition[];
};

export function useUpdateTemplate() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<Template, Error, UpdateTemplatePayload>({
    mutationFn: async ({
      organizationId,
      templateId,
      name,
      description,
      approvedResponse,
      rejectResponse,
      waitlistResponse,
      indemnity,
      metaDefinitions,
    }) => {
      const res = await api.patch<{ template: Template }>(
        `/organizations/${organizationId}/templates/${templateId}`,
        {
          name,
          description,
          approvedResponse,
          rejectResponse,
          waitlistResponse,
          indemnity,
          metaDefinitions,
        }
      );
      return res.template;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["organization-templates", variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "organization-template",
          variables.organizationId,
          variables.templateId,
        ],
      });
    },
  });

  return {
    updateTemplate: mutation.mutate,
    updateTemplateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}
