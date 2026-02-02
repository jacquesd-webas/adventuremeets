import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { Meet } from "../types/MeetModel";

export function useFetchMeet(meetId?: string | null, enabled = true) {
  const api = useApi();
  const query = useQuery({
    queryKey: ["meet", meetId],
    enabled: Boolean(enabled && meetId),
    queryFn: async () => {
      if (!meetId) return null;
      return api.get<Meet>(`/meets/${meetId}`);
    },
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}
