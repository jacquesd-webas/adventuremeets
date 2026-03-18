import { useMutation } from "@tanstack/react-query";
import { useApi } from "./useApi";

type ConfirmEmailVerificationPayload = {
  code: string;
};

export function useConfirmEmailVerification() {
  const api = useApi();

  const mutation = useMutation<any, Error, ConfirmEmailVerificationPayload>({
    mutationFn: async (payload) => {
      return api.post("/auth/email/verification/confirm", payload);
    },
  });

  return {
    confirmVerification: mutation.mutate,
    confirmVerificationAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}
