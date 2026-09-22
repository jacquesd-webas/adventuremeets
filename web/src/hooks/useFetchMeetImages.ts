import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";
import MeetImage from "../types/MeetImageModel";
import { meetImageQueryKeys } from "./meetImageQueryKeys";

const EMPTY_IMAGES: MeetImage[] = [];

export function useFetchMeetImages(meetId?: string | null, enabled = true) {
  const api = useApi();

  const query = useQuery({
    queryKey: meetImageQueryKeys.list(meetId),
    enabled: Boolean(enabled && meetId),
    queryFn: async () => {
      if (!meetId) return [];
      const response = await api.get<{ images: MeetImage[] }>(
        `/meets/${meetId}/images`,
      );
      return response.images ?? [];
    },
  });

  return {
    data: query.data ?? EMPTY_IMAGES,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}
