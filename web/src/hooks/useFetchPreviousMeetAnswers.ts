import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { meetSignupQueryKeys } from "./meetSignupQueryKeys";

export function useFetchPreviousMeetAnswers(
  meetId?: string,
  userId?: string,
  isMinor = false,
) {
  const api = useApi();
  const query = useQuery({
    queryKey: meetSignupQueryKeys.previousAnswers(meetId, userId, isMinor),
    enabled: Boolean(meetId && userId),
    queryFn: async () => {
      const response = await api.get<{ metaValues: Record<string, string> }>(
        `/meets/${meetId}/my-previous-answers?isMinor=${isMinor}`,
      );
      return response.metaValues ?? {};
    },
  });

  return {
    data: query.data ?? {},
    isLoading: query.isLoading,
  };
}
