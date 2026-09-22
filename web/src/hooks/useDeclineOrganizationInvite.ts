import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";

type DeclineOrganizationInvitePayload = {
  inviteId: string;
};

type OrganizationInviteResponse = {
  invite?: {
    organizationId?: string;
  };
  organizationId?: string;
};

export function useDeclineOrganizationInvite() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ inviteId }: DeclineOrganizationInvitePayload) => {
      return api.post<OrganizationInviteResponse>(
        `/organizations/invites/${inviteId}/decline`,
      );
    },
    onSuccess: (data) => {
      const organizationId = data?.invite?.organizationId ?? data?.organizationId;
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      queryClient.invalidateQueries({ queryKey: ["organisations"] });
      queryClient.invalidateQueries({ queryKey: ["organization-invites"] });
      if (organizationId) {
        queryClient.invalidateQueries({
          queryKey: ["organization-invites", organizationId],
        });
      }
    },
  });

  return {
    declineInvite: mutation.mutate,
    declineInviteAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? (mutation.error as Error).message : null,
  };
}
