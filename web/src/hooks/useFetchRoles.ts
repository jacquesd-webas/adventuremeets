import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { minutes } from "../helpers/time";
import RoleModel from "../types/RoleModel";

type RolesResponse = { roles: RoleModel[] } | RoleModel[];

export function useFetchRoles() {
  const api = useApi();

  const query = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await api.get<RolesResponse>("/types/roles");
      if (Array.isArray(res)) {
        return res;
      }
      return res.roles ?? [];
    },
    staleTime: minutes(10),
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}
