import { useApi } from "./useApi";
import { useQuery } from "@tanstack/react-query";
import { User } from "../types/UserModel";

type UsersResponse = { users: User[] } | User[];

export function useFetchUsers() {
  const api = useApi();

  const query = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get<UsersResponse>("/users");
      const users = Array.isArray(res) ? res : (res as any).users || [];
      return users;
    },
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}
