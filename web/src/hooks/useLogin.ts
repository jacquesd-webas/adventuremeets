import { useMutation } from "@tanstack/react-query";
import { useApi } from "./useApi";

type LoginPayload = {
  email: string;
  password: string;
};

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
};

export function useLogin() {
  const api = useApi();

  const mutation = useMutation<LoginResponse, Error, LoginPayload>({
    mutationFn: async (payload: LoginPayload) => {
      return api.post<LoginResponse>("/auth/login", payload);
    }
  });

  return {
    login: mutation.mutate,
    loginAsync: mutation.mutateAsync,
    data: mutation.data,
    isLoading: mutation.isPending,
    error: mutation.error
  };
}
