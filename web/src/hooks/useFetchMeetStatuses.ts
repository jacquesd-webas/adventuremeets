import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { minutes } from "../helpers/time";
import MeetStatus from "../types/MeetStatusModel";

type MeetStatusesResponse = { meetStatuses: MeetStatus[] };

export function useFetchMeetStatuses() {
  const api = useApi();

  const query = useQuery({
    queryKey: ["meetStatuses"],
    queryFn: async () => {
      const res = await api.get<MeetStatusesResponse>("/types/meetStatuses");
      if (Array.isArray(res)) {
        return res;
      }
      return res.meetStatuses ?? [];
    },
    staleTime: minutes(10),
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}

export function useMeetStatusLookup() {
  const { data: statuses, isLoading, error, refetch } = useFetchMeetStatuses();
  const byId = useMemo(() => {
    const map = new Map<number, string>();
    statuses.forEach((status) => map.set(status.id, status.name));
    return map;
  }, [statuses]);

  const getName = (id?: number | null, fallback = "Unknown") => {
    if (id === undefined || id === null) return fallback;
    return byId.get(id) ?? fallback;
  };

  return { data: statuses, isLoading, error, refetch, getName };
}
