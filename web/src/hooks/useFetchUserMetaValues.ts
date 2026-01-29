import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";

export type UserMetaValue = {
  key: string;
  value: string | null;
};

export function useFetchUserMetaValues(
  userId?: string,
  organizationId?: string
) {
  const api = useApi();
  const query = useQuery({
    queryKey: ["user-meta-values", userId, organizationId],
    enabled: Boolean(userId && organizationId),
    queryFn: async () => {
      if (!userId || !organizationId) return [];
      const res = await api.get<{ metaValues: UserMetaValue[] }>(
        `/users/${userId}/meta-values?organizationId=${organizationId}`
      );
      return res.metaValues ?? [];
    },
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}
