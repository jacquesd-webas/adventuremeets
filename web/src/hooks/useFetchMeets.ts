import { useApi } from "./useApi";
import { useQuery } from "@tanstack/react-query";
import Meet from "../types/MeetModel";

type MeetsResponse = { meets: Meet[] } | Meet[];

type UseFetchMeetsOptions = {
  view?: "reports" | "plan" | "my" | "all";
  page?: number;
  limit?: number;
  organizationId: string;
};

type MeetsApiResponse = {
  meets: Meet[];
  total: number;
  page: number;
  limit: number;
};

export function useFetchMeets(options: UseFetchMeetsOptions) {
  const api = useApi();

  const { view = "all", page = 1, limit = 20, organizationId } = options;

  const query = useQuery({
    queryKey: ["meets", { view, page, limit, organizationId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (view !== "all") params.set("view", view);
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (organizationId) params.set("organizationId", organizationId);
      const res = await api.get<MeetsResponse | MeetsApiResponse>(
        `/meets?${params.toString()}`
      );
      if (Array.isArray(res)) {
        return { meets: res as Meet[], total: res.length, page, limit };
      }
      if ((res as MeetsApiResponse).meets) {
        return res as MeetsApiResponse;
      }
      return { meets: (res as any).meets || [], total: 0, page, limit };
    },
  });

  return {
    data: (query.data?.meets || []) as Meet[],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? page,
    limit: query.data?.limit ?? limit,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}
