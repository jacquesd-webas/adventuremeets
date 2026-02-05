import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { Organization } from "../types/OrganizationModel";

export function useFetchOrganization(orgId?: string) {
  const api = useApi();

  const mapOrganization = (org: any): Organization => ({
    id: org.id,
    name: org.name,
    isPrivate: org.isPrivate ?? org.is_private ?? undefined,
    theme: org.theme ?? undefined,
    canViewAllMeets:
      org.canViewAllMeets ?? org.can_view_all_meets ?? undefined,
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
    createdAt: org.createdAt ?? org.created_at,
    updatedAt: org.updatedAt ?? org.updated_at,
  });

  const query = useQuery({
    queryKey: ["organization", orgId],
    enabled: Boolean(orgId),
    queryFn: async () => {
      const res = await api.get<{ organization: Organization }>(
        `/organizations/${orgId}`
      );
      return res?.organization ? mapOrganization(res.organization) : null;
    },
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
  };
}
