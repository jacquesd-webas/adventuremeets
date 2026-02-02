import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";

type UpdateOrganizationMemberPayload = {
  organizationId: string;
  userId: string;
  role?: string;
  status?: string;
};

export function useUpdateOrganizationMember() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<any, Error, UpdateOrganizationMemberPayload>({
    mutationFn: async ({ organizationId, userId, ...payload }) => {
      const res = await api.patch<{ member: any }>(
        `/organizations/${organizationId}/members/${userId}`,
        payload
      );
      return res.member ?? res;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["organization-members", variables.organizationId],
      });
    },
  });

  return {
    updateMember: mutation.mutate,
    updateMemberAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}
