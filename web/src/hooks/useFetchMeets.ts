import { useApi } from "./useApi";
import { useQuery } from "@tanstack/react-query";
import Meet from "../types/MeetModel";

type MeetsResponse = { meets: Meet[] } | Meet[];
type MeetsApiClient = {
  get: <T>(url: string) => Promise<T>;
};

export type UseFetchMeetsOptions = {
  view?: "all" | "my" | "upcoming" | "past" | "draft" | "calendar";
  scope?: "all" | "my";
  page?: number;
  limit?: number;
  organizationId?: string | null;
  search?: string;
  startDate?: string;
  endDate?: string;
};

export type MeetsApiResponse = {
  meets: Meet[];
  total: number;
  page: number;
  limit: number;
};

export async function fetchMeetsPage(
  api: MeetsApiClient,
  options: UseFetchMeetsOptions,
) {
  const {
    view = "all",
    scope,
    page = 1,
    limit = 20,
    organizationId,
    search,
    startDate,
    endDate,
  } = options;

  const params = new URLSearchParams();
  if (view !== "all") params.set("view", view);
  if (scope) params.set("scope", scope);
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (organizationId) params.set("organizationId", organizationId);
  if (search) params.set("search", search);
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const res = await api.get<MeetsResponse | MeetsApiResponse>(
    `/meets?${params.toString()}`,
  );
  if (Array.isArray(res)) {
    return { meets: res as Meet[], total: res.length, page, limit };
  }
  if ((res as MeetsApiResponse).meets) {
    return res as MeetsApiResponse;
  }
  return { meets: (res as any).meets || [], total: 0, page, limit };
}

export function useFetchMeets(options: UseFetchMeetsOptions) {
  const api = useApi();

  const {
    view = "all",
    scope,
    page = 1,
    limit = 20,
    organizationId,
    search,
    startDate,
    endDate,
  } = options;

  const query = useQuery({
    queryKey: [
      "meets",
      {
        view,
        scope,
        page,
        limit,
        organizationId,
        search,
        startDate,
        endDate,
      },
    ],
    enabled: !!organizationId,
    queryFn: async () => fetchMeetsPage(api, options),
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
