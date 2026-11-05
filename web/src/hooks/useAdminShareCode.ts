import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";

export function useAdminShareCode(meetId?: string, enabled = true) {
  const api = useApi();
  return useQuery({
    queryKey: ["meet", meetId, "admin-share-code"],
    enabled: Boolean(meetId && enabled),
    queryFn: () =>
      api.get<{ adminShareCode: string | null }>(
        `/meets/${meetId}/admin-share-code`,
      ),
  });
}
