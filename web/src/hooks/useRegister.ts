import { useMutation } from "@tanstack/react-query";
import { useApi } from "./useApi";

type RegisterPayload = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
};

type RegisterResponse = {
  accessToken: string;
  refreshToken: string;
};

export function useRegister() {
  const api = useApi();

  const mutation = useMutation<RegisterResponse, Error, RegisterPayload>({
    mutationFn: async (payload: RegisterPayload) => {
      return api.post<RegisterResponse>("/auth/register", payload);
    },
    onSuccess: (data) => {
      window.localStorage.setItem("accessToken", data.accessToken);
      window.localStorage.setItem("refreshToken", data.refreshToken);
    }
  });

  return {
    register: mutation.mutate,
    registerAsync: mutation.mutateAsync,
    data: mutation.data,
    isLoading: mutation.isPending,
    error: mutation.error
  };
}
