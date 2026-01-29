import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { UserMetaValue } from "./useFetchUserMetaValues";

type UpdateUserMetaValuesPayload = {
  userId: string;
  organizationId: string;
  values: UserMetaValue[];
};

export function useUpdateUserMetaValues() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<any, Error, UpdateUserMetaValuesPayload>({
    mutationFn: async ({ userId, organizationId, values }) => {
      return api.post(`/users/${userId}/meta-values`, {
        organizationId,
        values,
      });
    },
    onSuccess: (data, payload) => {
      const metaValues = data?.metaValues ?? [];
      queryClient.setQueryData(
        ["user-meta-values", payload.userId, payload.organizationId],
        metaValues
      );
      queryClient.invalidateQueries({
        queryKey: ["user-meta-values", payload.userId, payload.organizationId],
      });
    },
  });

  return {
    updateMetaValues: mutation.mutate,
    updateMetaValuesAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}
