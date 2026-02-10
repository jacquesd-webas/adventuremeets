import { useMutation } from "@tanstack/react-query";
import { useApi } from "./useApi";

type CheckEmailExistsResponse = {
  exists: boolean;
};

export function useCheckEmailExists() {
  const api = useApi();

  const mutation = useMutation<CheckEmailExistsResponse, Error, string>({
    mutationFn: async (email) => {
      return api.get<CheckEmailExistsResponse>(
        `/auth/register/check?email=${encodeURIComponent(email)}`
      );
    },
  });

  return {
    checkEmailExists: mutation.mutate,
    checkEmailExistsAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
    data: mutation.data ?? null,
  };
}
