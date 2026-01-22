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
      return users.map(mapUser);
    },
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}

const mapUser = (user: any): User => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName ?? user.first_name,
  lastName: user.lastName ?? user.last_name,
  phone: user.phone,
  createdAt: user.createdAt ?? user.created_at,
  updatedAt: user.updatedAt ?? user.updated_at,
  lastLoginAt: user.lastLoginAt ?? user.last_login_at,
  emailVerified:
    typeof user.emailVerified === "boolean"
      ? user.emailVerified
      : user.email_verified,
});
