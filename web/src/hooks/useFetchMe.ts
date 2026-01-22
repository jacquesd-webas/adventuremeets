import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { Me } from "../types/MeModel";
import { useEffect } from "react";

type Options = {
  onUnauthorized?: () => void;
  enabled?: boolean;
};

export function useFetchMe({ onUnauthorized, enabled = true }: Options) {
  const api = useApi();
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("accessToken")
      : null;

  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => api.get<Me>("/auth/me"),
    enabled: Boolean(token) && enabled,
  });

  useEffect(() => {
    const status = (query.error as (Error & { status?: number }) | null)
      ?.status;
    if (status === 401 && onUnauthorized) {
      onUnauthorized();
    }
  }, [query.error, onUnauthorized]);

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}
