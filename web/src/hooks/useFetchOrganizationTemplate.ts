import { useApi } from "./useApi";
import { useQuery } from "@tanstack/react-query";
import { Template } from "../types/TemplateModel";

export function useFetchOrganizationTemplate(
  organizationId?: string,
  templateId?: string
) {
  const api = useApi();

  const query = useQuery({
    queryKey: ["organization-template", organizationId, templateId],
    enabled: Boolean(organizationId && templateId),
    queryFn: async () => {
      const res = await api.get<{ template: Template }>(
        `/organizations/${organizationId}/templates/${templateId}`
      );
      return mapTemplate(res.template);
    },
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
  };
}

const mapTemplate = (template: any): Template => ({
  id: template.id,
  organizationId: template.organizationId ?? template.organization_id,
  name: template.name,
  description: template.description ?? undefined,
  metaDefinitions: template.metaDefinitions ?? [],
  createdAt: template.createdAt ?? template.created_at ?? "",
  updatedAt: template.updatedAt ?? template.updated_at ?? "",
  deletedAt: template.deletedAt ?? template.deleted_at,
});
