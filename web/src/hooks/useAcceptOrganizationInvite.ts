import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";

type AcceptOrganizationInvitePayload = {
  inviteId: string;
};

export function useAcceptOrganizationInvite() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ inviteId }: AcceptOrganizationInvitePayload) => {
      return api.post(`/organizations/invites/${inviteId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      queryClient.invalidateQueries({ queryKey: ["organisations"] });
    },
  });

  return {
    acceptInvite: mutation.mutate,
    acceptInviteAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? (mutation.error as Error).message : null,
  };
}
