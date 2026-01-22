import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { Template } from "../types/TemplateModel";

type CreateTemplatePayload = {
  organizationId: string;
  name: string;
  description?: string;
  metaDefinitions?: Array<{
    id?: string;
    fieldKey: string;
    label: string;
    fieldType: string;
    required?: boolean;
    config?: Record<string, any>;
  }>;
};

export function useCreateTemplate() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<Template, Error, CreateTemplatePayload>({
    mutationFn: async ({
      organizationId,
      name,
      description,
      metaDefinitions,
    }) => {
      const res = await api.post<{ template: Template }>(
        `/organizations/${organizationId}/templates`,
        { name, description, metaDefinitions }
      );
      return res.template;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["organization-templates", variables.organizationId],
      });
    },
  });

  return {
    createTemplate: mutation.mutate,
    createTemplateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}
