import { useApi } from "./useApi";
import { useQuery } from "@tanstack/react-query";
import { Template } from "../types/TemplateModel";

type TemplatesResponse = { templates: Template[] } | Template[];

export function useFetchOrganizationTemplates(orgId?: string) {
  const api = useApi();

  const query = useQuery({
    queryKey: ["organization-templates", orgId],
    enabled: Boolean(orgId),
    queryFn: async () => {
      const res = await api.get<TemplatesResponse>(
        `/organizations/${orgId}/templates`
      );
      const templates = Array.isArray(res) ? res : (res as any).templates || [];
      return templates.map(mapTemplate);
    },
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}

const mapTemplate = (template: any): Template => ({
  id: template.id,
  organizationId: template.organizationId ?? template.organization_id,
  name: template.name,
  description: template.description ?? undefined,
  indemnity: template.indemnity ?? undefined,
  approvedResponse: template.approvedResponse ?? template.approved_response,
  rejectResponse: template.rejectResponse ?? template.reject_response,
  waitlistResponse: template.waitlistResponse ?? template.waitlist_response,
  createdAt: template.createdAt ?? template.created_at ?? "",
  updatedAt: template.updatedAt ?? template.updated_at ?? "",
  deletedAt: template.deletedAt ?? template.deleted_at,
});
