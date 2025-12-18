import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";

type User = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  idp_profile?: {
    name?: string;
  };
};

type UsersResponse = { users: User[] } | User[];

export function useUsers() {
  const api = useApi();
  const token = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;

  const query = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get<UsersResponse>("/users");
      return Array.isArray(res) ? res : res.users || [];
    },
    enabled: Boolean(token)
  });

  return {
    users: query.data || [],
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null
  };
}
