import { useInfiniteQuery } from "@tanstack/react-query";
import Meet from "../types/MeetModel";
import { useApi } from "./useApi";
import {
  fetchMeetsPage,
  type MeetsApiResponse,
  type UseFetchMeetsOptions,
} from "./useFetchMeets";

export function useInfiniteFetchMeets(options: UseFetchMeetsOptions) {
  const api = useApi();

  const { organizationId, ...rest } = options;

  const query = useInfiniteQuery({
    queryKey: ["meets", "infinite", { organizationId, ...rest }],
    enabled: !!organizationId,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) =>
      fetchMeetsPage(api, {
        ...options,
        organizationId,
        page: pageParam as number,
      }),
    getNextPageParam: (lastPage: MeetsApiResponse) => {
      const loaded = lastPage.page * lastPage.limit;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });

  const pages = query.data?.pages ?? [];

  return {
    data: pages.flatMap((page) => page.meets) as Meet[],
    total: pages[0]?.total ?? 0,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}
