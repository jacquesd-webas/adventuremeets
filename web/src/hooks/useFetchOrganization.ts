import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { Organization } from "../types/OrganizationModel";

export function useFetchOrganization(orgId?: string) {
  const api = useApi();

  const query = useQuery({
    queryKey: ["organization", orgId],
    enabled: Boolean(orgId),
    queryFn: async () => {
      const res = await api.get<{ organization: Organization }>(
        `/organizations/${orgId}`
      );
      return res?.organization;
    },
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
  };
}
