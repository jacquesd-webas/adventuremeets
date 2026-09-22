import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { useAuth } from "../context/authContext";

type CopyMyMetaValuesFromAttendeePayload = {
  meetId: string;
  attendeeId: string;
};

type CopyMyMetaValuesFromAttendeeResponse = {
  organizationId: string;
  metaValues: Array<{ key: string; value?: string | null }>;
};

export function useCopyMyMetaValuesFromAttendee() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const mutation = useMutation<
    CopyMyMetaValuesFromAttendeeResponse,
    Error,
    CopyMyMetaValuesFromAttendeePayload
  >({
    mutationFn: async (payload) =>
      api.post<CopyMyMetaValuesFromAttendeeResponse>(
        "/users/me/meta-values/from-attendee",
        payload,
      ),
    onSuccess: (data) => {
      if (!user?.id) return;
      queryClient.setQueryData(
        ["user-meta-values", user.id, data.organizationId],
        data.metaValues,
      );
      queryClient.invalidateQueries({
        queryKey: ["user-meta-values", user.id, data.organizationId],
      });
    },
  });

  return {
    copyMyMetaValuesFromAttendee: mutation.mutate,
    copyMyMetaValuesFromAttendeeAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}
