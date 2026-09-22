import { useMutation } from "@tanstack/react-query";
import { useApi } from "./useApi";

export function useRequestEmailVerification() {
  const api = useApi();

  const mutation = useMutation<any, Error>({
    mutationFn: async () => {
      return api.post("/auth/email/verification");
    },
  });

  return {
    requestVerification: mutation.mutate,
    requestVerificationAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}
