import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";

type AuthMeResponse = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  idp_profile?: {
    name?: string;
  };
};

export function useMe() {
  const api = useApi();
  const token = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;

  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => api.get<AuthMeResponse>("/auth/me"),
    enabled: Boolean(token)
  });

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null
  };
}
