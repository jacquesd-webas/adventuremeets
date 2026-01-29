import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { useAuth } from "../context/authContext";

type UpdateUserPayload = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  password?: string;
};

export function useUpdateUser() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const mutation = useMutation<any, Error, UpdateUserPayload>({
    mutationFn: async (payload) => {
      const res = await api.patch<{ user: any }>(
        `/users/${payload.id}`,
        payload
      );
      return res.user;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "me"], { ...user, ...data });
    },
  });

  return {
    updateUser: mutation.mutate,
    updateUserAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}
