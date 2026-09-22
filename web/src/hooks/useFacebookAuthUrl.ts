import { useMutation } from "@tanstack/react-query";
import { useApi } from "./useApi";

type FacebookAuthUrlPayload = {
  redirectUri?: string;
  state?: string;
};

type FacebookAuthUrlResponse = {
  url: string;
};

export function useFacebookAuthUrl() {
  const api = useApi();

  const mutation = useMutation<
    FacebookAuthUrlResponse,
    Error,
    FacebookAuthUrlPayload | undefined
  >({
    mutationFn: async (payload) => {
      const params = new URLSearchParams();
      if (payload?.redirectUri) {
        params.set("redirectUri", payload.redirectUri);
      }
      if (payload?.state) {
        params.set("state", payload.state);
      }
      const query = params.toString();
      return api.get<FacebookAuthUrlResponse>(
        `/auth/facebook/url${query ? `?${query}` : ""}`,
      );
    },
  });

  return {
    getFacebookAuthUrl: mutation.mutate,
    getFacebookAuthUrlAsync: mutation.mutateAsync,
    data: mutation.data,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}

