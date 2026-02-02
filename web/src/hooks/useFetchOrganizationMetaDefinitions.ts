import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";

export type OrganizationMetaDefinition = {
  fieldKey: string;
  label: string;
  fieldType: string;
  required?: boolean;
  config?: Record<string, any>;
};

export function useFetchOrganizationMetaDefinitions(organizationId?: string) {
  const api = useApi();
  const query = useQuery({
    queryKey: ["organization", organizationId, "meta-definitions"],
    enabled: Boolean(organizationId),
    queryFn: async () => {
      if (!organizationId) return [];
      const res = await api.get<{ metaDefinitions: OrganizationMetaDefinition[] }>(
        `/organizations/${organizationId}/meta-definitions`
      );
      return res.metaDefinitions ?? [];
    },
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
  };
}
