import { useMutation } from "@tanstack/react-query";
import { useApi } from "./useApi";

type GoogleCodeLoginPayload = {
  code: string;
  redirectUri?: string;
  organizationId?: string;
};

type GoogleCodeLoginResponse = {
  accessToken: string;
  refreshToken: string;
};

export function useGoogleCodeLogin() {
  const api = useApi();

  const mutation = useMutation<
    GoogleCodeLoginResponse,
    Error,
    GoogleCodeLoginPayload
  >({
    mutationFn: async (payload) => {
      return api.post<GoogleCodeLoginResponse>("/auth/google/token", payload);
    },
    onSuccess: (data) => {
      window.localStorage.setItem("accessToken", data.accessToken);
      window.localStorage.setItem("refreshToken", data.refreshToken);
    },
  });

  return {
    googleCodeLogin: mutation.mutate,
    googleCodeLoginAsync: mutation.mutateAsync,
    data: mutation.data,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}
