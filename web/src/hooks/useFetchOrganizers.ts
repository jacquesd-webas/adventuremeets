import { useApi } from "./useApi";
import { useQuery } from "@tanstack/react-query";
import { User } from "../types/UserModel";

type OrganizersResponse = { organizers: User[] } | User[];

export function useFetchOrganizers(organizationId: string) {
  const api = useApi();

  const query = useQuery({
    queryKey: ["organizations", organizationId, "organizers"],
    queryFn: async () => {
      const res = await api.get<OrganizersResponse>(
        `/organizations/${organizationId}/organizers`
      );
      const users = Array.isArray(res) ? res : (res as any).organizers || [];
      return users;
    },
    enabled: !!organizationId,
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}
