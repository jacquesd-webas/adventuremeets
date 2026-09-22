import { useMutation } from "@tanstack/react-query";
import { useApi } from "./useApi";

type GoogleAuthUrlPayload = {
  redirectUri?: string;
  state?: string;
};

type GoogleAuthUrlResponse = {
  url: string;
};

export function useGoogleAuthUrl() {
  const api = useApi();

  const mutation = useMutation<
    GoogleAuthUrlResponse,
    Error,
    GoogleAuthUrlPayload | undefined
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
      return api.get<GoogleAuthUrlResponse>(
        `/auth/google/url${query ? `?${query}` : ""}`,
      );
    },
  });

  return {
    getGoogleAuthUrl: mutation.mutate,
    getGoogleAuthUrlAsync: mutation.mutateAsync,
    data: mutation.data,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}
