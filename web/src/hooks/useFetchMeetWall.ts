import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { WallItem } from "../types/WallItemModel";
import { meetWallQueryKeys } from "./meetWallQueryKeys";

type MeetWallResponse = {
  wallItems: WallItem[];
};

export function useFetchMeetWall(
  meetId?: string | null,
  attendeeId?: string | null,
  enabled = true,
) {
  const api = useApi();
  const query = useQuery({
    queryKey: meetWallQueryKeys.byMeet(meetId, attendeeId),
    enabled: Boolean(enabled && meetId),
    queryFn: async () => {
      if (!meetId) {
        return [];
      }
      const response = await api.get<MeetWallResponse>(
        attendeeId
          ? `/meets/${meetId}/wall?attendeeId=${encodeURIComponent(attendeeId)}`
          : `/meets/${meetId}/wall`,
      );
      return response.wallItems ?? [];
    },
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}

export default useFetchMeetWall;
