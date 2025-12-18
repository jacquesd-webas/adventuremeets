import { useApi } from "./useApi";
import { useQuery } from "@tanstack/react-query";

export type Meet = {
  id: string;
  name: string;
  location: string;
  start_time: string;
  end_time: string;
  status?: string;
  status_id?: number;
  has_indemnity?: boolean;
  indemnity?: string;
  allow_guests?: boolean;
  max_guests?: number;
  waitlist_message?: string;
  allow_minor_indemnity?: boolean;
};

type MeetsResponse = { meets: Meet[] } | Meet[];

type UseFetchMeetsOptions = {
  view?: "reports" | "plan" | "all";
  page?: number;
  limit?: number;
};

type MeetsApiResponse = {
  items: Meet[];
  total: number;
  page: number;
  limit: number;
};

export function useFetchMeets(options: UseFetchMeetsOptions = {}) {
  const api = useApi();

  const { view = "all", page = 1, limit = 20 } = options;

  const query = useQuery({
    queryKey: ["meets", { view, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (view !== "all") params.set("view", view);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const res = await api.get<MeetsResponse | MeetsApiResponse>(`/meets?${params.toString()}`);
      if (Array.isArray(res)) {
        return { items: res, total: res.length, page, limit };
      }
      if ((res as MeetsApiResponse).items) {
        return res as MeetsApiResponse;
      }
      return { items: (res as any).meets || [], total: 0, page, limit };
    }
  });

  return {
    data: query.data?.items || [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? page,
    limit: query.data?.limit ?? limit,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch
  };
}
