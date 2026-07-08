import { useMutation } from "@tanstack/react-query";
import { useApi } from "./useApi";

type FacebookCodeLoginPayload = {
  code: string;
  redirectUri?: string;
};

type FacebookCodeLoginResponse = {
  accessToken: string;
  refreshToken: string;
};

export function useFacebookCodeLogin() {
  const api = useApi();

  const mutation = useMutation<
    FacebookCodeLoginResponse,
    Error,
    FacebookCodeLoginPayload
  >({
    mutationFn: async (payload) => {
      return api.post<FacebookCodeLoginResponse>("/auth/facebook/token", payload);
    },
    onSuccess: (data) => {
      window.localStorage.setItem("accessToken", data.accessToken);
      window.localStorage.setItem("refreshToken", data.refreshToken);
    },
  });

  return {
    facebookCodeLogin: mutation.mutate,
    facebookCodeLoginAsync: mutation.mutateAsync,
    data: mutation.data,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}

