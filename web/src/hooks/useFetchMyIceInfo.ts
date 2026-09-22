import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { UserIceInfo } from "../types/UserIceInfoModel";

export function useFetchMyIceInfo(enabled = true) {
  const api = useApi();
  const query = useQuery({
    queryKey: ["users", "me", "ice"],
    enabled,
    queryFn: async () => {
      const res = await api.get<{ iceInfo: UserIceInfo | null }>("/users/me/ice");
      return res.iceInfo;
    },
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
  };
}
