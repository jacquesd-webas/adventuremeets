import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { Organization } from "../types/OrganizationModel";

export function useOrganization(orgId?: string) {
  const api = useApi();

  const query = useQuery({
    queryKey: ["organization", orgId],
    enabled: Boolean(orgId),
    queryFn: async () => {
      const res = await api.get<{ organization: any }>(`/organizations/${orgId}`);
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
        templateCount:
          typeof org.templateCount === "number"
            ? org.templateCount
            : org.template_count != null
            ? Number(org.template_count)
            : undefined,
      } as Organization;
    }
  });

  return {
    organization: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
  };
}
