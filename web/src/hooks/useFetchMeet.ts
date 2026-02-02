import { useQuery } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useApi } from "./useApi";

export function useFetchMeet(meetId?: string | null, enabled = true) {
  const api = useApi();
  const { enqueueSnackbar } = useSnackbar();
  return useQuery({
    queryKey: ["meet", meetId],
    enabled: Boolean(enabled && meetId),
    queryFn: async () => {
      if (!meetId) return null;
      return api.get(`/meets/${meetId}`);
    },
    onError: (error: any) => {
      const message =
        (error?.message as string) ||
        (typeof error === "string" ? error : "Failed to load meet");
      enqueueSnackbar(message, { variant: "error" });
    }
  });
}
