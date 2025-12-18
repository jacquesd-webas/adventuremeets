import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { minutes } from "../utils/time";

export type MeetStatus = {
  id: number;
  name: string;
};

type MeetStatusesResponse = { statuses: MeetStatus[] } | MeetStatus[];

export function useFetchMeetStatuses() {
  const api = useApi();

  const query = useQuery({
    queryKey: ["meet-statuses"],
    queryFn: async () => {
      const res = await api.get<MeetStatusesResponse>("/meets/statuses");
      if (Array.isArray(res)) {
        return res;
      }
      return res.statuses ?? [];
    },
    staleTime: minutes(10)
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch
  };
}

export function useMeetStatusLookup() {
  const { data, isLoading, error, refetch } = useFetchMeetStatuses();
  const byId = useMemo(() => {
    const map = new Map<number, string>();
    data.forEach((status) => map.set(status.id, status.name));
    return map;
  }, [data]);

  const getName = (id?: number | null, fallback = "Unknown") => {
    if (id === undefined || id === null) return fallback;
    return byId.get(id) ?? fallback;
  };

  return { data, isLoading, error, refetch, getName };
}
