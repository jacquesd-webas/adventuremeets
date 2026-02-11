import { useApi } from "./useApi";
import { useQuery } from "@tanstack/react-query";
import { Organization } from "../types/OrganizationModel";

type OrganisationsResponse =
  | { organisations: Organization[] }
  | { organizations: Organization[] }
  | Organization[];

type OrganisationsApiResponse = {
  items: Organization[];
  total: number;
  page: number;
  limit: number;
};

type UseFetchOrganisationsOptions = {
  page?: number;
  limit?: number;
  sortBy?: keyof Organization;
  sortOrder?: "asc" | "desc";
};

export function useFetchOrganisations(
  options: UseFetchOrganisationsOptions = {}
) {
  const api = useApi();
  const { page = 1, limit = 25, sortBy, sortOrder = "asc" } = options;

  const mapOrganization = (org: any): Organization => ({
    id: org.id,
    name: org.name,
    isPrivate: org.isPrivate ?? org.is_private ?? undefined,
    theme: org.theme ?? undefined,
    canViewAllMeets:
      org.canViewAllMeets ?? org.can_view_all_meets ?? undefined,
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
  });

  const query = useQuery({
    queryKey: ["organisations", { page, limit, sortBy, sortOrder }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (sortBy) params.set("sort", String(sortBy));
      if (sortOrder) params.set("order", sortOrder);
      const res = await api.get<OrganisationsResponse | OrganisationsApiResponse>(
        `/organisations?${params.toString()}`
      );
      if (Array.isArray(res)) {
        return {
          items: res.map(mapOrganization),
          total: res.length,
          page,
          limit,
        };
      }
      if ((res as OrganisationsApiResponse).items) {
        const typed = res as OrganisationsApiResponse;
        return {
          ...typed,
          items: typed.items.map(mapOrganization),
        };
      }
      const fallback =
        (res as any).organisations || (res as any).organizations || [];
      return {
        items: fallback.map(mapOrganization),
        total: fallback.length,
        page,
        limit,
      };
    },
  });

  return {
    data: query.data?.items || [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? page,
    limit: query.data?.limit ?? limit,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}
